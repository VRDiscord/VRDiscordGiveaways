import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, Colors, EmbedBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { syncDB } from "../intervals/syncdb";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "viewgiveaway",
    description: "Shows the status of a giveaway",
    options: [{
        type: ApplicationCommandOptionType.String,
        name: "message_id",
        description: "The message id of the giveaway"
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Shows a giveaway`
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.interaction.options.getString("message_id")
        if(id) {
            let res = await ctx.sql.query(`SELECT * FROM giveaways WHERE id=$1`, [id]).catch(() => null)

            if(!res || !res.rows.length) return ctx.error("Unable to find that giveaway")

            await syncDB(ctx.sql, ctx.client)
            
            const probability = (res.rows[0].winners / res.rows[0].users.length) * 10000

            let embed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle("Giveaway info")
            .setURL(`https://discord.com/channels/${ctx.interaction.guildId}/${res.rows[0].channel_id}/${res.rows[0].id}`)
            .setDescription(`${res.rows[0].name ?? id}`)
            .addFields([
                {name: "**ID**", value: id, inline: true},
                {name: "**Given out**", value: `${res.rows[0].won_users.length}/${res.rows[0].winners}`, inline: true},
                {name: "**Participants**", value: `${ctx.client.giveawayCache.get(id)!.length}`, inline: true},
                {name: "**Ends**", value: `<t:${Math.floor((res.rows[0].duration)/1000)}:R>`, inline: true},
                {name: "**Chance of winning**", value: `≈${Math.floor(probability)/100}%`, inline: true}
            ])
            
            ctx.reply({embeds: [embed], ephemeral: true})
        } else {
            let res = await ctx.sql.query(`SELECT * FROM giveaways`)
            let desc = `${res.rows.map((r, i) => `**${i+1}** ${r.rolled ? "✅" : "🕐"} [click here](https://discord.com/channels/${ctx.interaction.guildId}/${r.channel_id}/${r.id}) <t:${Math.floor(r.duration/1000)}:R> **${r.users.length}** entries`).join("\n")}`

            if(desc.length > 4000) return ctx.reply({content: "Attached below", files: [new AttachmentBuilder(Buffer.from(desc), {name: "giveaways.txt"})], ephemeral: true})
            let embed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle("Giveaways")
            .setDescription(desc)
        
            ctx.reply({embeds: [embed], ephemeral: true})
        }
    }
}