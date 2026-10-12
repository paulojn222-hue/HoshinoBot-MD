const config = require("../config.js");
const fs = require("fs");
const path = require("path");

const PREFIXO = config.prefixo || "!";
const NOME_BOT = config.nomeBot || "MoonBot-MDv1";
const PASTA_MIDIAS = path.join(__dirname, "..", "midias");
const CAMINHO_FOTO_MENU = path.join(PASTA_MIDIAS, "foto_menu.jpg");
const CAMINHO_VIDEO_MENU = path.join(PASTA_MIDIAS, "video_menu.mp4");

// ⚠️ AJUSTE O CAMINHO AQUI SE PRECISAR!
// Se rpg_config.js está na pasta "comandos": usa "./rpg_config.js"
// Se está fora da pasta "comandos": usa "../rpg_config.js"
const rpgModulo = require("./rpg_config.js");

// ✅ Garante pasta de mídias
if (!fs.existsSync(PASTA_MIDIAS)) fs.mkdirSync(PASTA_MIDIAS, { recursive: true });

// ✅ Verifica se tem foto ou vídeo salvo
function temFotoMenu() { return fs.existsSync(CAMINHO_FOTO_MENU); }
function temVideoMenu() { return fs.existsSync(CAMINHO_VIDEO_MENU); }

// ✅ CARREGA MENU
function carregarMenu(nomeArquivo = "menu_principal", usuarioMencao = "", idGrupo = "") {
  const caminhoMenu = path.join(__dirname, "..", "menus", `${nomeArquivo}.txt`);
  
  const dados = {
    NOME_BOT: NOME_BOT,
    PREFIXO: PREFIXO,
    DONO_NOME: config.donoNome || "Moon",
    DONO_NUMERO_VISIVEL: config.numeroDonoVisivel || config.numeroDono || "Não definido",
    VERSAO: config.versao || "1.0.0",
    USUARIO: usuarioMencao || "@pessoa"
  };

  // ✅ Status do RPG
  const statusRPG = idGrupo && idGrupo.includes("@g.us")
    ? (rpgModulo.rpgAtivoNoGrupo(idGrupo) ? "✅ ATIVADO" : "❌ DESATIVADO")
    : "❌ DESATIVADO";
  dados.STATUS_RPG = statusRPG;

  if (fs.existsSync(caminhoMenu)) {
    let texto = fs.readFileSync(caminhoMenu, "utf-8");
    texto = texto.replace(/{NOME_BOT}/g, dados.NOME_BOT);
    texto = texto.replace(/{PREFIXO}/g, dados.PREFIXO);
    texto = texto.replace(/{DONO_NOME}/g, dados.DONO_NOME);
    texto = texto.replace(/{DONO_NUMERO_VISIVEL}/g, dados.DONO_NUMERO_VISIVEL);
    texto = texto.replace(/{VERSAO}/g, dados.VERSAO);
    texto = texto.replace(/{USUARIO}/g, dados.USUARIO);
    texto = texto.replace(/{STATUS_RPG}/g, dados.STATUS_RPG);
    return texto;
  }
  return `⚠️ Menu não encontrado!`;
}

// ✅ Pega menção do usuário
function pegarMencao(idUsuario) {
  if (!idUsuario) return "@pessoa";
  return `@${idUsuario.split("@")[0]}`;
}

module.exports = {
  nome: "membros",
  comandos: {

    // 🗑️ !rm_midiamenu — Remove foto e vídeo do menu
    rm_midiamenu: async (sock, msg, args, dados) => {
      const idChat = dados.idChat;
      const remetente = dados.remetente;

      const numeroLimpo = String(remetente).replace(/\D/g, "");
      const DONO_PRINCIPAL_LIMPO = String(config.numeroDono).replace(/\D/g, "");
      if (numeroLimpo !== DONO_PRINCIPAL_LIMPO) return;

      let apagou = [];
      if (fs.existsSync(CAMINHO_FOTO_MENU)) {
        fs.unlinkSync(CAMINHO_FOTO_MENU);
        apagou.push("🖼️ Foto");
      }
      if (fs.existsSync(CAMINHO_VIDEO_MENU)) {
        fs.unlinkSync(CAMINHO_VIDEO_MENU);
        apagou.push("🎥 Vídeo");
      }

      if (apagou.length === 0) {
        return sock.sendMessage(idChat, { text: "ℹ️ Nenhuma mídia do menu encontrada para remover!\nO menu já está em modo texto. 📝" });
      }

      return sock.sendMessage(idChat, {
        text: `✅ *MÍDIA DO MENU REMOVIDA!* 🗑️\n\n${apagou.join(" e ")}\n\nAgora o !menu será enviado somente com texto. 📝🕸`
      });
    },

    // 👑 !adms — Lista administradores
    adms: async (sock, msg, args, dados) => {
      const idChat = msg.key.remoteJid;
      const remetente = msg.key.participant || msg.key.remoteJid;

      if (!idChat.includes("@g.us")) {
        return sock.sendMessage(idChat, { text: "⚠️ Use este comando dentro de um grupo! 🕸" });
      }

      try {
        const meta = await sock.groupMetadata(idChat);
        const administradores = meta.participants.filter(p => p.admin);
        if (!administradores.length) {
          return sock.sendMessage(idChat, { text: "⚠️ Nenhum administrador encontrado! 🕷" });
        }

        const listaAdms = administradores.map(a => `👑 @${a.id.split("@")[0]}`).join("\n");
        const mencionarTodos = administradores.map(a => a.id);
        const mensagem = `╭━━━━━━━━━━ 👑 ADMINISTRADORES 👑 ━━━━━━━━━━╮
┃
┃ 👑 *ADMINISTRADORES DO GRUPO*
┃
${listaAdms}
┃
┃ 📋 Solicitado por: @${remetente.split("@")[0]}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
        return sock.sendMessage(idChat, { text: mensagem, mentions: mencionarTodos.concat(remetente) });

      } catch (erro) {
        console.log(`❌ Erro no !adms: ${erro.message}`);
        return sock.sendMessage(idChat, { text: "❌ Não consegui buscar os administradores! 🕷" });
      }
    },

    // 🖼️ !setfotomenu
    setfotomenu: async (sock, msg, args, dados) => {
      const idChat = dados.idChat;
      const remetente = dados.remetente;

      const numeroLimpo = String(remetente).replace(/\D/g, "");
      const DONO_PRINCIPAL_LIMPO = String(config.numeroDono).replace(/\D/g, "");
      if (numeroLimpo !== DONO_PRINCIPAL_LIMPO) return;

      const citada = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!citada || (!citada.imageMessage && !citada.jpegThumbnail)) {
        return sock.sendMessage(idChat, { text: "⚠️ Responda uma FOTO com:\n!setfotomenu 🖼️" });
      }

      try {
        const { downloadMediaMessage } = require("@whiskeysockets/baileys");
        const buffer = await downloadMediaMessage(
          { key: msg.message.extendedTextMessage.contextInfo.stanzaId, message: citada },
          "buffer",
          {}
        );

        if (fs.existsSync(CAMINHO_FOTO_MENU)) fs.unlinkSync(CAMINHO_FOTO_MENU);
        if (!fs.existsSync(PASTA_MIDIAS)) fs.mkdirSync(PASTA_MIDIAS, { recursive: true });
        fs.writeFileSync(CAMINHO_FOTO_MENU, buffer);

        return sock.sendMessage(idChat, {
          text: "✅ *FOTO DO MENU ATUALIZADA!* 🖼️🕸\n\n💡 Digite !menu de novo — se aparecer a antiga, feche e abra o WhatsApp!"
        });
      } catch {
        return sock.sendMessage(idChat, { text: "❌ Erro ao salvar a foto!" });
      }
    },

    // 🎥 !setvideomenu
    setvideomenu: async (sock, msg, args, dados) => {
      const idChat = dados.idChat;
      const remetente = dados.remetente;

      const numeroLimpo = String(remetente).replace(/\D/g, "");
      const DONO_PRINCIPAL_LIMPO = String(config.numeroDono).replace(/\D/g, "");
      if (numeroLimpo !== DONO_PRINCIPAL_LIMPO) return;

      const citada = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!citada || !citada.videoMessage) {
        return sock.sendMessage(idChat, { text: "⚠️ Responda um VÍDEO com:\n!setvideomenu 🎥" });
      }

      try {
        const { downloadMediaMessage } = require("@whiskeysockets/baileys");
        const buffer = await downloadMediaMessage(
          { key: msg.message.extendedTextMessage.contextInfo.stanzaId, message: citada },
          "buffer",
          {}
        );

        if (fs.existsSync(CAMINHO_VIDEO_MENU)) fs.unlinkSync(CAMINHO_VIDEO_MENU);
        if (!fs.existsSync(PASTA_MIDIAS)) fs.mkdirSync(PASTA_MIDIAS, { recursive: true });
        fs.writeFileSync(CAMINHO_VIDEO_MENU, buffer);

        return sock.sendMessage(idChat, {
          text: "✅ *VÍDEO DO MENU ATUALIZADO!* 🎥🕸\n\n💡 Digite !menu de novo para ver o novo!"
        });
      } catch {
        return sock.sendMessage(idChat, { text: "❌ Erro ao salvar o vídeo!" });
      }
    },

// ⚡ !ping
ping: async (sock, msg, args, dados) => {
  await sock.sendMessage(dados.idChat, {
    text: "⚡ Pong mestre! ⚡️"
  });
},

menu: async (sock, msg, args, dados) => {
       const idChat = msg.key?.remoteJid || dados?.idChat;
       const remetente = msg.key?.participant || msg.key?.remoteJid || dados?.remetente;
       // ✅ Verifica se tem os dados essenciais
       if (!idChat || !remetente) {
         console.log("❌ Dados inválidos no comando !menu:", { idChat, remetente });
         return;
       }
       // ✅ Carrega o menu com proteção contra erros
       let texto = "";
       let tipoMidia = null;
       let caminhoMidia = null;
       let numero = remetente.split("@")[0] || "Usuário";
       try {
         const menuCarregado = carregarMenu("principal", remetente, NOME_BOT, PREFIXO);
         texto = menuCarregado.texto;
         tipoMidia = menuCarregado.tipoMidia;
         caminhoMidia = menuCarregado.caminhoMidia;
         numero = menuCarregado.numero || numero;
       } catch (erro) {
         console.log("❌ Erro ao carregar menu principal:", erro);
         texto = `╭━━━━━━━━━━ 🤖 MENU PRINCIPAL 🤖 ━━━━━━━━━━╮
 ┃
 ┃ 👤 Usuário: @${numero}
 ┃ 🤖 Bot: ${NOME_BOT}
 ┃ 🔖 Prefixo: ${PREFIXO}
 ┃
 ┃ ⚠️ Menu carregado do texto padrão
 ┃
 ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
       }
       // 📤 Envia com mídia ou só texto
       try {
         if (tipoMidia === "video" && caminhoMidia && fs.existsSync(caminhoMidia)) {
           return sock.sendMessage(idChat, {
             video: fs.readFileSync(caminhoMidia),
             caption: texto,
             gifPlayback: true,
             mentions: [remetente]
           }, { quoted: msg });
         } else if (tipoMidia === "image" && caminhoMidia && fs.existsSync(caminhoMidia)) {
           return sock.sendMessage(idChat, {
             image: fs.readFileSync(caminhoMidia),
             caption: texto,
             mentions: [remetente]
           }, { quoted: msg });
         } else {
           return sock.sendMessage(idChat, {
             text: texto,
             mentions: [remetente]
           }, { quoted: msg });
         }
       } catch (erroEnvio) {
         console.log("❌ Erro ao enviar menu:", erroEnvio);
         // Fallback: tenta enviar só texto
         return sock.sendMessage(idChat, {
           text: texto || "✅ Menu carregado!"
         }, { quoted: msg });
       }
     },
    // 👤 !dono
    dono: async (sock, msg, args, dados) => {
      return sock.sendMessage(dados.idChat, {
        text: `✨️*𝐴𝑞𝑢𝑖 𝑒𝑠𝑡𝑎́ 𝑜 𝑐𝑜𝑛𝑡𝑎𝑡𝑜 𝑑𝑜 𝑚𝑒𝑢 𝑚𝑒𝑠𝑡𝑟𝑒:*${config.numeroDonoVisivel}`
      });
    },

    // ℹ️ !sobre
    sobre: async (sock, msg, args, dados) => {
      return sock.sendMessage(dados.idChat, {
        text: `🤖 *${NOME_BOT}*\n\n📦 Versão: ${config.versao}\n👨‍💻 Criado por: Moon\n✨ Bot de administração e divulgação\n\nObrigado por usar! 💜`
      });
    }
  }
};

