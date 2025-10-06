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
const qrcode = require("qrcode-terminal");

const pairingCode = false;
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
      // exibe no terminal em forma de QR visual
      qrcode.generate(qr, { small: true });
      console.log("QR code gerado acima. Escaneie com WhatsApp.");
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
  });

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

          const interactiveMessage = proto.Message.InteractiveMessage.create({
            body: {
              text: "📌 *Bem-vindo ao Menu do CarrosselBot!* Escolha um card:",
            },
            footer: { text: "🤖 CarrosselBot - Tecnologia e Criatividade" },
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
                        {
                          name: "cta_url",
                          buttonParamsJson: JSON.stringify({
                            display_text: "🔗 Acessar",
                            url: "https://google.com",
                          }),
                        },
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
                        {
                          name: "quick_reply",
                          buttonParamsJson: JSON.stringify({
                            display_text: "CLIQUE AQUI",
                            id: "menu",
                          }),
                        },
                      ],
                    },
                  },
                  {
                    header: {
                      imageMessage: imageMessages[2],
                      hasMediaAttachment: true,
                    },
                    body: {
                      text: "👤 *Sobre o bot* - Conheça o criador e o projeto.",
                    },
                    nativeFlowMessage: {
                      buttons: [
                        {
                          name: "cta_copy",
                          buttonParamsJson: JSON.stringify({
                            display_text: "BOTÃO DE COPIAR",
                            copy_text: "Comando de exemplo",
                          }),
                        },
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

  sock.ev.on("creds.update", saveCreds);
}

connectToWhatsApp();
