import { useState } from "react";
import { Mail, MapPin, Send, User, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Escribe un mensaje antes de enviar.");
      return;
    }

    setSending(true);

    const subject = encodeURIComponent(
      `Mensaje de ${name || "un visitante"} desde rmrLocations`
    );
    const body = encodeURIComponent(
      `Nombre: ${name || "No indicado"}\nEmail: ${email || "No indicado"}\n\nMensaje:\n${message}`
    );

    window.location.href = `mailto:montoyacode@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setSending(false);
      toast.success("Redirigiendo a tu cliente de correo…");
    }, 500);
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "var(--background)" }}
    >
      {/* Hero strip */}
      <div
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "3rem 1rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--primary)",
            marginBottom: "1rem",
          }}
        >
          <Mail size={28} style={{ color: "#fff" }} />
        </div>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            color: "var(--ink)",
            margin: "0 0 0.5rem 0",
          }}
        >
          Contacto
        </h1>
        <p
          style={{
            color: "var(--ink-muted)",
            fontSize: "1.1rem",
            maxWidth: "500px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          ¿Tienes una sugerencia, encontraste un bug o quieres colaborar?
          Escríbeme y te responderé lo antes posible.
        </p>
      </div>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
        className="px-4 md:px-6"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2rem",
          }}
          className="md:grid-cols-[1fr_1.4fr]"
        >
          {/* Left: Developer info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Developer card */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontFamily: "var(--display)",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                  }}
                >
                  RM
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--ink)",
                      margin: "0 0 0.15rem 0",
                    }}
                  >
                    Ing. R. Montoya R.
                  </h3>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--ink-muted)",
                      margin: 0,
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Desarrollador Full Stack
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    fontSize: "0.9rem",
                    color: "var(--ink)",
                  }}
                >
                  <Mail size={16} style={{ color: "var(--primary)" }} />
                  <span>montoyacode@gmail.com</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    fontSize: "0.9rem",
                    color: "var(--ink-muted)",
                  }}
                >
                  <Phone size={16} style={{ color: "var(--ink-muted)" }} />
                  <span style={{ fontFamily: "var(--mono)" }}>
                    WhatsApp — Próximamente
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    fontSize: "0.9rem",
                    color: "var(--ink-muted)",
                  }}
                >
                  <MapPin size={16} style={{ color: "var(--ink-muted)" }} />
                  <span>CDMX, México</span>
                </div>
              </div>
            </div>

            {/* Quick info */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--ink-muted)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Este proyecto — <strong style={{ color: "var(--ink)" }}>rmrLocations</strong> —
                es una plataforma de descubrimiento de lugares. Si tienes ideas,
                encuentras algo que no funciona, o simplemente quieres saludar,
                ¡no dudes en escribirme!
              </p>
            </div>
          </div>

          {/* Right: Contact form */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--display)",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "var(--ink)",
                margin: "0 0 0.25rem 0",
              }}
            >
              Envíame un mensaje
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--ink-muted)",
                margin: "0 0 1.25rem 0",
              }}
            >
              Se abrirá tu cliente de correo para enviar el mensaje.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Input
                label="Tu nombre"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User size={16} />}
              />

              <Input
                label="Tu email (opcional)"
                type="email"
                placeholder="juan@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Textarea
                label="Mensaje"
                placeholder="Cuéntame qué necesitas, qué no funciona, o lo que quieras…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={4000}
                rows={6}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "0.75rem",
                    color: "var(--ink-muted)",
                  }}
                >
                  {message.length}/4000
                </span>
              </div>

              <Button type="submit" loading={sending} size="lg">
                <Send size={16} />
                Enviar mensaje
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
