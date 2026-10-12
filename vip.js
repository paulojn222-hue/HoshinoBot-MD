const config = require("../config.js");

module.exports = {
  nome: "vip",
  comandos: {
    vip: async (sock, msg, args, dados) => {
      const idChat = dados.idChat;
      
      const planos = config.planosVip || {};
      const beneficios = config.beneficiosVip || [];
      const numeroDono = config.numeroDonoVisivel || config.numeroDono || "—";
      const numeroLimpo = String(config.numeroDono).replace(/\D/g, "");
      
      let texto = `
💎 *PLANOS VIP — ${config.nomeBot || "BOT"}* 🕸

✨ *O QUE O VIP GANHA:*
───────────────────────
`;
      
      beneficios.forEach(b => {
        texto += `✅ ${b}\n`;
      });
      
      texto += `
💰 *VALORES:*
───────────────────────
`;
      
      // Monta os planos automaticamente do config
      const cores = ["🟢", "🥂", "🍷", "🍸"];
      let i = 0;
      for (const p of Object.values(planos)) {
        const tempo = p.dias ? `${p.dias} Dias` : "♾️ Vitalício";
        texto += `${cores[i] || "🔹"} ${p.nome} → ${p.valor} (${tempo})\n`;
        i++;
      }
      
      texto += `
📞 *CONTRATAR:*
Fale com o dono:
wa.me/${numeroDono}
Número: ${numeroDono}

🎯 *Seja VIP e aproveite tudo!* 💜
`.trim();
      
      return sock.sendMessage(idChat, { text: texto });
    }
  }
};

