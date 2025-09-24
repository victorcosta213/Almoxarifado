import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, senha);
      navigate("/");
    } catch (err) {
      setErro("Credenciais inválidas. Verifique e tente novamente.");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h3 className="text-center mb-4">🔐 Acesso ao Sistema</h3>

        {erro && <div className="alert alert-danger">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 input-group">
            <span className="input-group-text">📧</span>
            <input
              type="email"
              className="form-control"
              placeholder="Email institucional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3 input-group">
            <span className="input-group-text">🔒</span>
            <input
              type="password"
              className="form-control"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-dark w-100 mt-2">Entrar</button>
        </form>

        <p className="text-muted text-center mt-3" style={{ fontSize: '0.9em' }}>
          Acesso restrito ao sistema de almoxarifado do CRT-03.
        </p>
      </div>
    </div>
  );
}
