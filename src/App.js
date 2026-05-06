import { useEffect, useState } from "react";
import { Toast } from "bootstrap";

import * as pdfjslib from "pdfjs-dist";

import Field from "./components/Field";

import {
  zoom_in,
  zoom_out,
  upload,
  plus,
  eye_open,
  eye_close,
} from "./config/icon";

import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  AreaHighlight,
} from "react-pdf-highlighter";

import "bootstrap/dist/css/bootstrap.min.css";

import "./App.css";

import "react-pdf-highlighter/dist/style.css";

pdfjslib.GlobalWorkerOptions.workerSrc =
  window.location.origin + "/pdf.worker.min.mjs";

export default function App() {
  const [highlight, setHighlight] = useState();
  const [scale, setScale] = useState(1);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fields, setFields] = useState([]);
  const [commonLength, setCommonLength] = useState(null);
  const [tableName, setTableName] = useState("");
  const [sql, setSql] = useState("");
  const [tolerance, setTolerance] = useState(10);
  const [isHidden, setIsHidden] = useState(false);
  let toastInstance = null;

  function createFields(columns) {
    const fields_ = Array.from({ length: columns.length }, () => ({
      nome: "",
      dados: [],
      id: crypto.randomUUID(),
      isNumerico: true,
    }));

    columns.forEach((column, index) => {
      fields_[index].dados = column.map((val) => val.text);
    });

    setFields(fields_);
    return fields_;
  }

  function extractTextFromArea() {
    if (!highlight) {
      return;
    }

    const pageNumber = highlight.position.pageNumber;

    const page = document.querySelector(`[data-page-number="${pageNumber}"]`);

    if (!page) return;

    const spans = page.querySelectorAll(".textLayer span");

    const pos = highlight.position.boundingRect;

    const pageRect = page.getBoundingClientRect();

    const vx1 = pageRect.left + pos.x1;
    const vx2 = pageRect.left + pos.x2;
    const vy1 = pageRect.top + pos.y1;
    const vy2 = pageRect.top + pos.y2;

    const results = [];

    spans.forEach((span) => {
      const rect = span.getBoundingClientRect();

      const overlaps =
        rect.right >= vx1 &&
        rect.left <= vx2 &&
        rect.bottom >= vy1 &&
        rect.top <= vy2;

      if (overlaps && span.textContent.trim().length !== 0) {
        results.push({ text: span.textContent, x: rect.left, y: rect.top });
      }
    });

    const columns = [];

    results.forEach((item) => {
      let column = columns.find((l) => Math.abs(l[0].x - item.x) < tolerance);

      if (!column) {
        column = [];
        columns.push(column);
      }

      column.push(item);
    });

    columns.forEach((column) => {
      column.sort((a, b) => a.y - b.y);
    });

    columns.sort((a, b) => a[0].x - b[0].x);

    return columns;
  }

  function processColumns() {
    setSql("");
    const columns = extractTextFromArea();
    if (columns?.length > 0) {
      createFields(columns);
      setMostCommon();
    }
  }

  function generateSql() {
    let colunas = [];
    let values = Array.from({ length: commonLength }, () => {
      return new Array(fields.length);
    });

    fields.forEach((field, fieldIndex) => {
      const dados = [...field.dados];
      dados.length = commonLength;
      colunas.push(field.nome.trim().length > 0 ? field.nome : "NULL");
      dados.forEach((dado, index) => {
        values[index][fieldIndex] =
          dado === undefined || dado === null || dado.trim().length === 0
            ? "NULL"
            : field.isNumerico
              ? Number(dado.replace(",", "."))
              : "'" + String(dado).replace(/'/g, "''") + "'";
      });
    });

    const values_str = values.map((value) => "(" + value.join(",") + ")");

    let sql = ["INSERT INTO"];
    sql.push(tableName.length > 0 ? tableName : "NULL");
    sql.push("(" + colunas.join(",") + ")");
    sql.push("VALUES");
    sql.push(values_str.join(","));

    setSql(sql.join(" ") + ";");
  }

  const setMostCommon = () => {
    if (fields && fields.length > 0) {
      const freq = {};
      let max = fields[0].dados.length;
      fields.forEach((field) => {
        freq[field.dados.length] = (freq[field.dados.length] || 0) + 1;
        if (freq[field.dados.length] > freq[max]) {
          max = field.dados.length;
        }
      });
      setCommonLength(max);
    }
  };

  useEffect(() => {
    setMostCommon();
  }, [fields]);

  const handleChangeDado = (field, fieldIndex, index, nome) => {
    const fields_ = [...fields];
    fields_[fieldIndex].dados[index] = nome;
    setFields(fields_);
  };

  const handleSetPadraoDado = (field, fieldIndex, index) => {
    const fields_ = [...fields];
    fields[fieldIndex].dados = Array.from(
      { length: fields[fieldIndex].dados.length },
      (_) => fields[fieldIndex].dados[index],
    );

    setFields(fields_);
  };

  const handleAddDado = (field, fieldIndex, index) => {
    const fields_ = [...fields];
    fields_[fieldIndex].dados.splice(index, 0, "");
    setFields(fields_);
  };

  const handleDeleteDado = (field, fieldIndex, index) => {
    const fields_ = [...fields];
    fields_[fieldIndex].dados.splice(index, 1);
    setFields(fields_);
  };

  const handleDeleteField = (field, fieldIndex) => {
    const fields_ = [...fields];
    fields_.splice(fieldIndex, 1);
    setFields(fields_);
  };

  const handleNameChange = (field, fieldIndex, nome) => {
    const fields_ = [...fields];
    fields_[fieldIndex].nome = nome;
    setFields(fields_);
  };

  const handleChangeType = (field, fieldIndex) => {
    const fields_ = [...fields];
    fields_[fieldIndex].isNumerico = !fields_[fieldIndex].isNumerico;
    setFields(fields_);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setPdfUrl(fileUrl);
  };

  return (
    <div className="appContainer">
      <div className="pdfContainer">
        <div className="zoomButtonContainer">
          <button
            className="zoomButton btn btn-dark d-flex align-items-center justify-content-center"
            onClick={() => {
              setScale(Math.max(0.2, scale - 0.2));
            }}
          >
            {zoom_out}
          </button>
          <button
            className="zoomButton btn btn-dark d-flex align-items-center justify-content-center"
            onClick={() => {
              setScale(Math.min(2, scale + 0.2));
            }}
          >
            {zoom_in}
          </button>
          <button
            className="zoomButton btn btn-dark d-flex align-items-center justify-content-center"
            onClick={() => {
              setIsHidden(!isHidden);
            }}
          >
            {isHidden ? eye_open : eye_close}
          </button>
        </div>
        <PdfLoader
          url={pdfUrl}
          beforeLoad={
            <div
              style={{
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                display: "flex",
              }}
            >
              <a>Escolha um arquivo...</a>
            </div>
          }
        >
          {(pdfDocument) => (
            <PdfHighlighter
              pdfScaleValue={scale}
              key={scale}
              pdfDocument={pdfDocument}
              highlights={highlight ? [highlight] : []}
              enableAreaSelection={(e) => e.altKey}
              onSelectionFinished={(position, content, hideTipAndSelection) => {
                setHighlight({ position, content });
                hideTipAndSelection();
              }}
              highlightTransform={(highlight, _, __, ___, viewportToScaled) => {
                const isText = !highlight.content?.image;

                return isText ? (
                  <></>
                ) : (
                  <AreaHighlight
                    highlight={highlight}
                    onChange={(rect) => {
                      highlight.position.boundingRect = viewportToScaled(rect);
                      setHighlight(highlight);
                    }}
                  />
                );
              }}
            />
          )}
        </PdfLoader>
      </div>
      <div className="sideBar" hidden={isHidden}>
        <input
          type="file"
          multiple={false}
          className="form-control mb-2"
          accept="application/pdf"
          onChange={handleFileChange}
        ></input>

        <div className="input-group mb-2 col-12">
          <span className="input-group-text">({fields.length})</span>
          <input
            placeholder="Nome da tabela"
            defaultValue={""}
            className="form-control"
            type="text"
            onBlur={(e) => setTableName(e.target.value)}
          ></input>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            className="btn btn-primary col-8 me-2"
            onClick={() => {
              processColumns();
            }}
          >
            Processar seleção
          </button>
          <div className="input-group flex" title="Tolerância">
            <input
              id="tolerancia"
              className="form-control"
              type="number"
              max="100"
              min="1"
              value={tolerance}
              readOnly
            ></input>

            <button
              className="btn btn-primary"
              onClick={() => setTolerance(Math.min(100, tolerance + 1))}
            >
              +
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setTolerance(Math.max(1, tolerance - 1))}
            >
              -
            </button>
          </div>
        </div>

        <div className="fieldsContainer">
          {fields.map((field, idx) => {
            return (
              <Field
                key={field.id}
                deleteDisabled={fields.length <= 1}
                nome={field.nome}
                dados={field.dados}
                isNumerico={field.isNumerico}
                onDelete={() => {
                  handleDeleteField(field, idx);
                }}
                onChangeName={(nome) => {
                  handleNameChange(field, idx, nome);
                }}
                onChangeDado={(index, nome) => {
                  handleChangeDado(field, idx, index, nome);
                }}
                onDeleteDado={(index) => {
                  handleDeleteDado(field, idx, index);
                }}
                onCreateDado={(index) => {
                  handleAddDado(field, idx, index);
                }}
                onSetPadrao={(index) => {
                  handleSetPadraoDado(field, idx, index);
                }}
                onChangeType={() => {
                  handleChangeType(field, idx);
                }}
                isDifferent={
                  commonLength && field.dados.length !== commonLength
                }
              ></Field>
            );
          })}
          <button
            hidden={fields.length === 0}
            className="btn btn-success mt-2 "
            onClick={() => {
              setFields([
                ...fields,
                {
                  nome: "",
                  dados: [""],
                  id: crypto.randomUUID(),
                  isNumerico: true,
                },
              ]);
            }}
          >
            {plus}
          </button>
        </div>
        <button
          className="btn btn-primary mb-2 mt-2"
          disabled={fields.length === 0}
          onClick={() => {
            generateSql();
          }}
        >
          Gerar SQL
        </button>
        <div
          title="Copiar"
          className="card result "
          style={{ cursor: sql && sql.trim().length > 0 ? "pointer" : "auto" }}
          onClick={async () => {
            if (sql && sql.trim().length > 0) {
              await navigator.clipboard.writeText(sql);

              const toastEl = document.getElementById("copyToast");

              if (!toastInstance) {
                toastInstance = new Toast(toastEl);
              }

              toastInstance.show();
            }
          }}
        >
          <a>{sql}</a>
        </div>
      </div>
      <div
        id="copyToast"
        className="toast position-fixed bottom-0 start-0 m-3 text-bg-primary"
        style={{
          zIndex: 10000,
        }}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-bs-delay="2000"
      >
        <div className="toast-body">SQL copiado!</div>
      </div>
    </div>
  );
}
