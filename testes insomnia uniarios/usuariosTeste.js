const request = require("supertest");
const app = require("../server");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("pg", () => require("../__mocks__/pg"));

describe("Rotas de Autenticação", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = require("pg").Pool().query;
    jest.clearAllMocks();
  });

  describe("POST /api/auth/registrar", () => {
    it("deve registrar um terapeuta com sucesso", async () => {
      const newUser = {
        nome: "João",
        email: "joao@teste.com",
        senha: "123456",
      };
      const hashedPassword = await bcrypt.hash(newUser.senha, 10);
      mockPool.mockResolvedValue({ rows: [{ id: 1, email: newUser.email }] });

      const response = await request(app)
        .post("/api/auth/registrar")
        .send(newUser)
        .expect(201);

      expect(response.body.message).toBe("Terapeuta registrado com sucesso!");
      expect(response.body.terapeuta).toEqual({ id: 1, email: newUser.email });
      expect(mockPool).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO terapeutas"),
        [newUser.nome, newUser.email, expect.any(String), expect.anything()]
      );
    });

    it("deve retornar 400 se campos obrigatórios faltarem", async () => {
      const response = await request(app)
        .post("/api/auth/registrar")
        .send({ nome: "João" })
        .expect(400);

      expect(response.body.error).toBe("Nome, email e senha são obrigatórios.");
    });

    it("deve retornar 500 em erro interno", async () => {
      mockPool.mockRejectedValue(new Error("Erro DB"));

      const response = await request(app)
        .post("/api/auth/registrar")
        .send({ nome: "João", email: "joao@teste.com", senha: "123456" })
        .expect(500);

      expect(response.body.error).toBe("Erro interno do servidor.");
    });
  });

  describe("POST /api/auth/login", () => {
    it("deve fazer login com sucesso", async () => {
      const user = { email: "joao@teste.com", senha: "123456" };
      const hashedPassword = await bcrypt.hash(user.senha, 10);
      const dbUser = {
        id: 1,
        email: user.email,
        senha_hash: hashedPassword,
        nome: "João",
        tipo_login: "terapeuta",
      };
      mockPool.mockResolvedValue({ rows: [dbUser] });

      const response = await request(app)
        .post("/api/auth/login")
        .send(user)
        .expect(200);

      expect(response.body.message).toBe("Login bem-sucedido!");
      expect(response.body.token).toBeDefined();
      expect(response.body.role).toBe("terapeuta");
      const decoded = jwt.verify(
        response.body.token,
        process.env.JWT_SECRET || "hash123"
      );
      expect(decoded.email).toBe(user.email);
    });

    it("deve retornar 400 se email ou senha faltarem", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "joao@teste.com" })
        .expect(400);

      expect(response.body.error).toBe("Email e senha são obrigatórios.");
    });

    it("deve retornar 401 para credenciais inválidas", async () => {
      mockPool.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "joao@teste.com", senha: "123456" })
        .expect(401);

      expect(response.body.error).toBe("Credenciais inválidas.");
    });
  });
});
