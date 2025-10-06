//BASE BY PEDRO HENRIQUE
//VAI UTILIZAR A BASE? DA OS CREDITOS POW
//MEU ZAPZAP: +55 11 91337-2146

const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  proto,
  prepareWAMessageMedia,
} = require("baileys");
const makeWASocket = require("baileys").default;
const pino = require("pino");
const NodeCache = require("node-cache");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const qrcode = require("qrcode");

const msgRetryCounterCache = new NodeCache();

async function getBuffer(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary");
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    //  printQRInTerminal: !pairingCode, //obsoleto
    logger: pino({ level: "silent" }),
    browser: ["Carrossel", "Safari", "1.0.0"],
    msgRetryCounterCache,
    markOnlineOnConnect: true,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(
        "QR Code Recebido! Escaneie com o WhatsApp no qrcode na pasta 'QRCODE'"
      );
      generateQRCode(qr);
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log("Conexão encerrada. Tentando reconectar...");
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("🤖 BOT ONLINE!");
    }

    function generateQRCode(qr) {
      const qrImagePath = path.join(__dirname, "QRCODE", "qr-code.png");
      const qrDir = path.dirname(qrImagePath);
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

      qrcode.toFile(qrImagePath, qr, { type: "png" }, (err) => {
        if (err) console.error("Erro ao gerar o QR code: ", err);
      });
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const message = messages[0];
    if (!message.message || message.key.fromMe) return;

    const from = message.key.remoteJid;
    const sender = message.key.remoteJid;
    const msgType = Object.keys(message.message)[0];
    const text =
      msgType === "interactiveResponseMessage"
        ? JSON.parse(
            message.message.interactiveResponseMessage.nativeFlowResponseMessage
              .paramsJson
          ).id
        : msgType === "conversation"
        ? message.message.conversation
        : msgType === "imageMessage"
        ? message.message.imageMessage.caption
        : msgType === "videoMessage"
        ? message.message.videoMessage.caption
        : msgType === "extendedTextMessage"
        ? message.message.extendedTextMessage.text
        : msgType === "buttonsResponseMessage"
        ? message.message.buttonsResponseMessage.selectedButtonId
        : msgType === "listResponseMessage"
        ? message.message.listResponseMessage.singleSelectReply.selectedRowId
        : msgType === "templateButtonReplyMessage"
        ? message.message.templateButtonReplyMessage.selectedId
        : msgType === "messageContextInfo"
        ? message.message.buttonsResponseMessage?.selectedButtonId ||
          message.message.listResponseMessage?.singleSelectReply
            .selectedRowId ||
          ""
        : "";

    const nome = message.pushName || "Usuário";
    const messageDetails = messages[0];

    const selectedId =
      message?.message?.templateButtonReplyMessage?.selectedId ||
      message?.message?.buttonsResponseMessage?.selectedButtonId ||
      message?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      (msgType === "interactiveResponseMessage"
        ? JSON.parse(
            message.message.interactiveResponseMessage.nativeFlowResponseMessage
              .paramsJson
          ).id
        : false);

    //const nick = text?.split(" ").slice(1).join(" ");

    // TODO: Obter apenas o comando
    //     let comandoEscolhido = (selectedId && typeof selectedId === "string" ? selectedId.trim() : "") ||
    //  (text && typeof text === "string" ? text.trim() : "");
    //const args = text.trim().split(" ").slice(1);
    //comandoEscolhido = comandoEscolhido.toLowerCase().split(" ")[0]; // Normaliza e pega a primeira palavra
    // TODO: Obter apenas o comando
    let comandoEscolhido =
      (selectedId && typeof selectedId === "string" ? selectedId.trim() : "") ||
      (text && typeof text === "string" ? text.trim() : "");

    comandoEscolhido = comandoEscolhido.toLowerCase().split(" ")[0]; // Normaliza e pega a primeira palavra

    var selo = {
      key: {
        remoteJid: "status@broadcast",
        participant: "0@c.us", //`${sender.split('@')[0]}@c.us`,
        fromMe: false,
      },
      message: {
        contactMessage: {
          displayName: `BY PEDRIN`,
          vcard:
            "BEGIN:VCARD\n" +
            "VERSION:3.0\n" +
            `FN:Banco\n` +
            `ORG:Banco;\n` +
            `TEL;type=MSG;type=CELL;type=VOICE;waid=${sender.split("@")[0]}:${
              sender.split("@")[0]
            }\n` +
            "END:VCARD",
        },
      },
    };

    switch (text?.toLowerCase()) {
      case "menu":
        try {
          const images = [
            "https://d.top4top.io/p_3224fdkh60.jpeg",
            "https://i.ibb.co/PZMXH0MM/caquinhobot.jpg",
            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
          ];

          const imageMessages = [];
          for (const imageUrl of images) {
            const imageBuffer = await getBuffer(imageUrl);
            const preparedImage = await prepareWAMessageMedia(
              { image: imageBuffer },
              { upload: sock.waUploadToServer }
            );
            imageMessages.push(preparedImage.imageMessage);
          }

          const makeButton = (type, text, value) => {
            switch (type) {
              case "url":
                return {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: text,
                    url: value,
                  }),
                };
              case "copy":
                return {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({
                    display_text: text,
                    copy_text: value,
                  }),
                };
              case "quick":
                return {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: text,
                  }),
                };
            }
          };

          const interactiveMessage = proto.Message.InteractiveMessage.create({
            body: {
              text: "📌 *Bem-vindo ao Menu do CaquinhoBot!* Escolha um card:",
            },
            footer: { text: "🤖 CaquinhoBot - Tecnologia e Criatividade" },
            carouselMessage:
              proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                cards: [
                  {
                    header: {
                      imageMessage: imageMessages[0],
                      hasMediaAttachment: true,
                    },
                    body: {
                      text: "🔥 *Painel de Novidades* - Fique por dentro das atualizações.",
                    },
                    nativeFlowMessage: {
                      buttons: [
                        makeButton(
                          "url",
                          "🌐 Site Oficial",
                          "https://google.com"
                        ),
                        makeButton("quick", "💬 Falar com o Suporte"),
                        makeButton("copy", "📋 Copiar Cupom", "PROMO10"),
                        makeButton(
                          "url",
                          "📸 Instagram",
                          "https://instagram.com"
                        ),
                        makeButton("quick", "🧠 Dica do Dia"),
                        makeButton(
                          "copy",
                          "🔑 Chave de Acesso",
                          "caquinho-access-2025"
                        ),
                        makeButton("url", "🎥 YouTube", "https://youtube.com"),
                        makeButton("quick", "🎮 Jogos"),
                        makeButton("copy", "💾 Código Secreto", "ZX-9821"),
                        makeButton(
                          "url",
                          "💻 GitHub",
                          "https://github.com/CaquinhoDev"
                        ),
                      ],
                    },
                  },
                  {
                    header: {
                      imageMessage: imageMessages[1],
                      hasMediaAttachment: true,
                    },
                    body: {
                      text: "🧰 *Central de Comandos* - Tudo que o bot sabe fazer.",
                    },
                    nativeFlowMessage: {
                      buttons: [
                        makeButton("quick", "📜 Ver Todos os Comandos"),
                        makeButton(
                          "url",
                          "📘 Documentação",
                          "https://example.com/docs"
                        ),
                        makeButton(
                          "copy",
                          "🪄 Copiar Exemplo",
                          "menu ajuda sobre"
                        ),
                        makeButton("quick", "🧩 Funções Beta"),
                        makeButton(
                          "url",
                          "⚙️ Configurações",
                          "https://example.com/settings"
                        ),
                        makeButton("copy", "🔖 Token", "CAQBOT-ALPHA-921"),
                        makeButton("quick", "💬 Feedback"),
                        makeButton(
                          "url",
                          "🛰️ Status do Servidor",
                          "https://status.example.com"
                        ),
                        makeButton("copy", "🔐 Código Dev", "DEV-MODE-ON"),
                        makeButton("quick", "📈 Estatísticas"),
                      ],
                    },
                  },
                  {
                    header: {
                      imageMessage: imageMessages[2],
                      hasMediaAttachment: true,
                    },
                    body: {
                      text: "👤 *Sobre o CaquinhoBot* - Conheça o criador e o projeto.",
                    },
                    nativeFlowMessage: {
                      buttons: [
                        makeButton(
                          "url",
                          "🔍 Ver no GitHub",
                          "https://github.com/CaquinhoDev"
                        ),
                        makeButton("quick", "💡 Ideias Futuras"),
                        makeButton(
                          "copy",
                          "📋 Email do Dev",
                          "caquinho.dev@proton.me"
                        ),
                        makeButton(
                          "url",
                          "☕ Apoiar Projeto",
                          "https://buymeacoffee.com"
                        ),
                        makeButton("quick", "👨‍💻 Contato Direto"),
                        makeButton(
                          "copy",
                          "📜 Licença",
                          "Apache License - CaquinhoBot"
                        ),
                        makeButton(
                          "url",
                          "🌎 Site Oficial",
                          "https://caquinho.dev"
                        ),
                        makeButton("quick", "🎤 Voz da IA"),
                        makeButton(
                          "copy",
                          "🔗 Link Especial",
                          "https://chat.openai.com"
                        ),
                        makeButton(
                          "url",
                          "📫 Telegram",
                          "https://t.me/caquinho" //nem existe kkakakakakaka
                        ),
                      ],
                    },
                  },
                ],
              }),
          });

          await sock.relayMessage(
            from,
            { viewOnceMessage: { message: { interactiveMessage } } },
            {}
          );
        } catch (error) {
          console.error(error);
          await sock.sendMessage(from, {
            text: "⚠️ Ocorreu um erro ao carregar o menu interativo.",
          });
        }
        break;
    }
  });

  //  sock.ev.on("creds.update", saveCreds);
}

connectToWhatsApp();
