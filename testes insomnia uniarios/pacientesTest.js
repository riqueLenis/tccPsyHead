const request = require("supertest");
const app = require("../server");
const jwt = require("jsonwebtoken");

jest.mock("pg", () => require("../__mocks__/pg"));

describe("Rotas de Pacientes", () => {
  let mockPool, tokenTerapeuta, tokenAdmin;

  beforeEach(() => {
    mockPool = require("pg").Pool().query;
    jest.clearAllMocks();
    tokenTerapeuta = jwt.sign(
      { id: 1, email: "terapeuta@teste.com", role: "terapeuta" },
      process.env.JWT_SECRET || "hash123"
    );
    tokenAdmin = jwt.sign(
      { id: 2, email: "admin@teste.com", role: "admin" },
      process.env.JWT_SECRET || "hash123"
    );
  });

  describe("POST /api/auth/registrar-paciente", () => {
    it("deve registrar um paciente com sucesso", async () => {
      const newPaciente = {
        nome: "Ana",
        email: "ana@teste.com",
        senha: "123456",
      };
      mockPool.mockResolvedValue({ rows: [{ id: 1 }] });
      mockPool.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post("/api/auth/registrar-paciente")
        .send(newPaciente)
        .expect(201);

      expect(response.body.message).toBe("Paciente registrado com sucesso!");
    });

    it("deve retornar 409 se email duplicado", async () => {
      mockPool.mockRejectedValue({ code: "23505" });

      const response = await request(app)
        .post("/api/auth/registrar-paciente")
        .send({ nome: "Ana", email: "ana@teste.com", senha: "123456" })
        .expect(409);

      expect(response.body.error).toBe("Este e-mail já está em uso.");
    });
  });

  describe("POST /api/pacientes", () => {
    it("deve cadastrar paciente como terapeuta", async () => {
      const pacienteData = {
        nome_completo: "Ana Silva",
        dataNascimento: "1990-01-01",
        celular: "11999999999",
        motivacaoConsulta: "Teste",
        email: "ana@teste.com",
      };
      mockPool.mockResolvedValue({
        rows: [{ id: 1, nome_completo: pacienteData.nome_completo }],
      });

      const response = await request(app)
        .post("/api/pacientes")
        .set("Authorization", `Bearer ${tokenTerapeuta}`)
        .send(pacienteData)
        .expect(201);

      expect(response.body.message).toBe("Paciente cadastrado com sucesso!");
      expect(mockPool).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO pacientes"),
        expect.arrayContaining([
          pacienteData.nome_completo,
          "1990-01-01",
          undefined,
          undefined,
          1,
        ])
      );
    });

    it("deve retornar 403 se paciente tentar cadastrar", async () => {
      const tokenPaciente = jwt.sign(
        { id: 3, role: "paciente" },
        process.env.JWT_SECRET || "seu_segredo_super_secreto"
      );

      const response = await request(app)
        .post("/api/pacientes")
        .set("Authorization", `Bearer ${tokenPaciente}`)
        .send({ nome_completo: "Ana" })
        .expect(403);

      expect(response.body.error).toBe(
        "Pacientes não podem cadastrar outros pacientes."
      );
    });
  });

  describe("GET /api/pacientes", () => {
    it("deve listar pacientes do terapeuta", async () => {
      mockPool.mockResolvedValue({ rows: [{ id: 1, nome_completo: "Ana" }] });

      const response = await request(app)
        .get("/api/pacientes")
        .set("Authorization", `Bearer ${tokenTerapeuta}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /api/pacientes/:id", () => {
    it("deve buscar paciente específico", async () => {
      mockPool.mockResolvedValue({ rows: [{ id: 1, nome_completo: "Ana" }] });

      const response = await request(app)
        .get("/api/pacientes/1")
        .set("Authorization", `Bearer ${tokenTerapeuta}`)
        .expect(200);

      expect(response.body.nome_completo).toBe("Ana");
    });

    it("deve retornar 404 se não encontrado", async () => {
      mockPool.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get("/api/pacientes/999")
        .set("Authorization", `Bearer ${tokenTerapeuta}`)
        .expect(404);

      expect(response.body.error).toBe("Paciente não encontrado ");
    });
  });

  describe("PUT /api/pacientes/:id", () => {
    it("deve atualizar paciente", async () => {
      const updateData = {
        nome_completo: "Ana Silva Atualizada",
        data_nascimento: "1990-01-01",
        celular: "11999999999",
        motivacao_consulta: "Atualizado",
      };
      mockPool.mockResolvedValue({
        rows: [{ id: 1, nome_completo: updateData.nome_completo }],
      });

      const response = await request(app)
        .put("/api/pacientes/1")
        .set("Authorization", `Bearer ${tokenTerapeuta}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe("paciente atualizado com sucesso!!");
    });

    it("deve retornar 400 se campos obrigatórios faltarem", async () => {
      const response = await request(app)
        .put("/api/pacientes/1")
        .set("Authorization", `Bearer ${tokenTerapeuta}`)
        .send({ nome_completo: "Ana" })
        .expect(400);

      expect(response.body.error).toBe("campos obrigatórios faltando!!");
    });
  });

  describe("PUT /api/pacientes/:pacienteId/atribuir", () => {
    it("deve atribuir terapeuta a paciente como admin", async () => {
      mockPool.mockResolvedValue({ rows: [{ id: 1, terapeuta_id: 2 }] });

      const response = await request(app)
        .put("/api/pacientes/1/atribuir")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ terapeuta_id: 2 })
        .expect(200);

      expect(response.body.message).toBe("Paciente atualizado com sucesso!");
    });

    it("deve retornar 400 se nenhum ID enviado", async () => {
      const response = await request(app)
        .put("/api/pacientes/1/atribuir")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe(
        "Pelo menos um ID (terapeuta ou usuário) é obrigatório."
      );
    });
  });

  describe("DELETE /api/pacientes/:id", () => {
    it("deve excluir paciente", async () => {
      mockPool.mockResolvedValue({
        rowCount: 1,
        rows: [{ nome_completo: "Ana" }],
      });

      const response = await request(app)
        .delete("/api/pacientes/1")
        .set("Authorization", `Bearer ${tokenTerapeuta}`)
        .expect(200);

      expect(response.body.message).toContain("Ana");
    });

    it("deve retornar 404 se não encontrado", async () => {
      mockPool.mockResolvedValue({ rowCount: 0 });

      const response = await request(app)
        .delete("/api/pacientes/999")
        .set("Authorization", `Bearer ${tokenTerapeuta}`)
        .expect(404);

      expect(response.body.error).toBe("Paciente não encontrado para exclusão");
    });
  });
});
