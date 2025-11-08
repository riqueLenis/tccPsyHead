const request = require("supertest");
const app = require("../server");
const jwt = require("jsonwebtoken");

jest.mock("pg", () => require("../__mocks__/pg"));

describe("Rotas de Medicações", () => {
  let mockPool, token;

  beforeEach(() => {
    mockPool = require("pg").Pool().query;
    jest.clearAllMocks();
    token = jwt.sign(
      { id: 1, role: "terapeuta" },
      process.env.JWT_SECRET || "hash123"
    );
  });

  describe("POST /api/pacientes/:pacienteId/medicacoes", () => {
    it("deve adicionar medicação", async () => {
      const medData = {
        nome_medicamento: "Aspirina",
        data_inicio: "2025-11-07",
      };
      mockPool.mockResolvedValue({ rows: [{ id: 1 }] });

      const response = await request(app)
        .post("/api/pacientes/1/medicacoes")
        .set("Authorization", `Bearer ${token}`)
        .send(medData)
        .expect(201);

      expect(response.body.message).toBe("Medicação registrada com sucesso!");
    });

    it("deve retornar 400 se campos obrigatórios faltarem", async () => {
      const response = await request(app)
        .post("/api/pacientes/1/medicacoes")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe(
        "Nome do medicamento e data de início são obrigatórios."
      );
    });
  });

  describe("GET /api/pacientes/:pacienteId/medicacoes", () => {
    it("deve listar medicações de um paciente", async () => {
      mockPool.mockResolvedValue({ rows: [{ id: 1 }] });

      const response = await request(app)
        .get("/api/pacientes/1/medicacoes")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("PUT /api/medicacoes/:id", () => {
    it("deve atualizar medicação", async () => {
      const updateData = {
        nome_medicamento: "Aspirina 500mg",
        data_inicio: "2025-11-07",
      };
      mockPool.mockResolvedValue({ rows: [{ id: 1 }] });

      const response = await request(app)
        .put("/api/medicacoes/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe("Medicação atualizada com sucesso!");
    });
  });

  describe("DELETE /api/medicacoes/:id", () => {
    it("deve excluir medicação", async () => {
      mockPool.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .delete("/api/medicacoes/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe("Medicação excluída com sucesso.");
    });
  });
});
