import React, { useState } from "react";

import {
  number,
  alphabet,
  box_down,
  trash,
  plus,
  arrow_down,
  arrow_up,
  collapse_up,
  collapse_down,
} from "../config/icon.js";

import "bootstrap/dist/css/bootstrap.min.css";

import "./Field.css";

function Field(props) {
  const {
    field,
    onDelete,
    condicaoDisabled,
    onChangeIsCondicao,
    onChangeName,
    onChangeDado,
    onDeleteDado,
    onCreateDado,
    onSetPadrao,
    isDifferent,
    onChangeType,
  } = props;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`field card w-100 ${isDifferent ? "bg-warning" : ""}`}>
      <div className="fieldHeader">
        <div
          class="form-check form-check-inline me-2 p-0"
          hidden={condicaoDisabled}
        >
          <input
            type="checkbox"
            class="btn-check"
            id={`btn-check-outlined${field.id}`}
            autocomplete="off"
            defaultValue={field.isCondicao}
            onClick={() => {
              onChangeIsCondicao();
            }}
          />
          <label
            class="btn btn-outline-primary"
            for={`btn-check-outlined${field.id}`}
          >
            Condição
          </label>
        </div>
        <div className="input-group">
          <button
            className="btn btn-outline-primary"
            type="button"
            style={{ justifyContent: "center" }}
            onClick={() => onChangeType()}
          >
            {field.isNumerico ? number : alphabet}
          </button>

          <input
            placeholder="Nome do campo"
            defaultValue={field.nome}
            className="form-control"
            style={{ marginRight: "10px" }}
            onBlur={(e) => onChangeName(e.target.value)}
          ></input>
        </div>
        <button
          className="btn btn-danger col-3 me-2"
          onClick={() => {
            onDelete();
          }}
        >
          Remover
        </button>
        <a style={{ fontSize: 20, marginRight: 5 }}>({field.dados.length})</a>
      </div>
      <div className="info" hidden={!isVisible}>
        <div>
          {field.dados.map((dado, index) => {
            return (
              <div className="infoContent" key={crypto.randomUUID()}>
                <div className="col-1">
                  <a>[{index + 1}]</a>
                </div>
                <div className={index === 0 ? "col-4" : "col-5"}>
                  <input
                    style={{ width: "100%" }}
                    defaultValue={dado}
                    placeholder="NULL"
                    onBlur={(e) => onChangeDado(index, e.target.value)}
                  ></input>
                </div>
                <div
                  style={{
                    justifyContent: "end",
                    display: "flex",
                    flexGrow: 1,
                    width: "fit-content",
                  }}
                >
                  <button
                    className="btn btn-primary infoButton"
                    title="Copiar padrão"
                    hidden={index !== 0}
                    onClick={() => {
                      onSetPadrao(index);
                    }}
                  >
                    {box_down}
                  </button>
                  <button
                    title="Adicionar acima"
                    className="btn btn-success infoButton"
                    onClick={() => {
                      onCreateDado(index);
                    }}
                  >
                    {plus} {arrow_up}
                  </button>
                  <button
                    title="Adicionar abaixo"
                    className="btn btn-success infoButton"
                    onClick={() => {
                      onCreateDado(index + 1);
                    }}
                  >
                    {plus} {arrow_down}
                  </button>
                  <button
                    disabled={field.dados.length <= 1}
                    title="Excluir"
                    className="btn btn-danger infoButton"
                    onClick={() => {
                      onDeleteDado(index);
                    }}
                  >
                    {trash}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button
        title={isVisible ? "Esconder entradas" : "Expandir entradas"}
        className="collapseButton"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? collapse_up : collapse_down}
      </button>
    </div>
  );
}

export default React.memo(Field);
