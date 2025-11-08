const request = require("supertest");
const app = require("../server");
const jwt = require("jsonwebtoken");

jest.mock("pg", () => require("../__mocks__/pg"));

describe("Rotas de Sessões", () => {
  let mockPool, token;

  beforeEach(() => {
    mockPool = require("pg").Pool().query;
    jest.clearAllMocks();
    token = jwt.sign(
      { id: 1, role: "terapeuta" },
      process.env.JWT_SECRET || "hash123",
    );
  });

  describe("POST /api/sessoes", () => {
    it("deve criar uma sessão", async () => {
      const sessaoData = {
        paciente_id: 1,
        data_sessao: "2025-11-07",
        duracao_minutos: 60,
      };
      mockPool.mockResolvedValue({ rows: [{ id: 1 }] });

      const response = await request(app)
        .post("/api/sessoes")
        .set("Authorization", `Bearer ${token}`)
        .send(sessaoData)
        .expect(201);

      expect(response.body.message).toBe("Sessão registrada com sucesso!");
    });

    it("deve retornar 400 se campos obrigatórios faltarem", async () => {
      const response = await request(app)
        .post("/api/sessoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ paciente_id: 1 })
        .expect(400);

      expect(response.body.error).toBe(
        "ID do paciente e data da sessão são obrigatórios."
      );
    });
  });

  describe("GET /api/sessoes/:id", () => {
    it("deve buscar detalhes de uma sessão", async () => {
      mockPool.mockResolvedValue({ rows: [{ id: 1, paciente_nome: "Ana" }] });

      const response = await request(app)
        .get("/api/sessoes/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.paciente_nome).toBe("Ana");
    });

    it("deve retornar 404 se não encontrada", async () => {
      mockPool.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get("/api/sessoes/999")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe("Sessão não encontrada.");
    });
  });

  describe("PUT /api/sessoes/:id", () => {
    it("deve atualizar uma sessão", async () => {
      const updateData = { data_sessao: "2025-11-08", duracao_minutos: 90 };
      mockPool.mockResolvedValue({ rows: [{ id: 1 }] });

      const response = await request(app)
        .put("/api/sessoes/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe("Sessão atualizada com sucesso!");
    });

    it("deve retornar 400 se data faltar", async () => {
      const response = await request(app)
        .put("/api/sessoes/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ duracao_minutos: 90 })
        .expect(400);

      expect(response.body.error).toBe("A data da sessão é obrigatória.");
    });
  });

  describe("DELETE /api/sessoes/:id", () => {
    it("deve excluir uma sessão", async () => {
      mockPool.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .delete("/api/sessoes/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe("Sessão excluída com sucesso.");
    });
  });

  describe("GET /api/pacientes/:pacienteId/sessoes", () => {
    it("deve listar sessões de um paciente", async () => {
      mockPool.mockResolvedValue({ rows: [{ id: 1 }] });

      const response = await request(app)
        .get("/api/pacientes/1/sessoes")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /api/sessoes", () => {
    it("deve listar sessões para agenda do terapeuta", async () => {
      mockPool.mockResolvedValue({ rows: [{ id: 1, title: "Ana" }] });

      const response = await request(app)
        .get("/api/sessoes")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body[0].title).toBe("Ana");
    });
  });
});
