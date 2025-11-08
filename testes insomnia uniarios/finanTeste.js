const request = require("supertest");
const app = require("../server");
const jwt = require("jsonwebtoken");

jest.mock("pg", () => require("../__mocks__/pg"));

describe("Rotas Financeiras", () => {
  let mockPool, token;

  beforeEach(() => {
    mockPool = require("pg").Pool().query;
    jest.clearAllMocks();
    token = jwt.sign(
      { id: 1, role: "admin" },
      process.env.JWT_SECRET || "hash123"
    );
  });

  describe("GET /api/financeiro/resumo", () => {
    it("deve retornar resumo do mês", async () => {
      mockPool.mockResolvedValue({
        rows: [
          {
            faturamento_mes: 1000,
            a_receber: 200,
            sessoes_pagas: 5,
            sessoes_pendentes: 2,
          },
        ],
      });

      const response = await request(app)
        .get("/api/financeiro/resumo")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.faturamento_mes).toBe(1000);
    });
  });

  describe("GET /api/financeiro/transacoes", () => {
    it("deve listar transações recentes", async () => {
      mockPool.mockResolvedValue({ rows: [{ id: 1, paciente_nome: "Ana" }] });

      const response = await request(app)
        .get("/api/financeiro/transacoes")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("POST /api/relatorios/financeiro", () => {
    it("deve gerar relatório financeiro", async () => {
      const reportData = { data_inicio: "2025-11-01", data_fim: "2025-11-07" };
      mockPool.mockResolvedValue({
        rows: [{ faturamento_total: 1500, total_sessoes: 10 }],
      });
      mockPool.mockResolvedValue({ rows: [{ paciente_nome: "Ana" }] });

      const response = await request(app)
        .post("/api/relatorios/financeiro")
        .set("Authorization", `Bearer ${token}`)
        .send(reportData)
        .expect(200);

      expect(response.body.resumo.faturamento_total).toBe(1500);
    });

    it("deve retornar 400 se datas faltarem", async () => {
      const response = await request(app)
        .post("/api/relatorios/financeiro")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe(
        "Data de início e data de fim são obrigatórias."
      );
    });
  });
});
