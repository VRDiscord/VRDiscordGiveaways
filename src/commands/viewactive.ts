import { ApplicationCommandData, Message, MessageEmbed, NewsChannel, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { determineWinner } from "../intervals/determineWinners";
import { syncDB } from "../intervals/syncdb";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "viewactive",
    description: "Ends a giveaway",
    options: [{
        type: "STRING",
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
        let id = ctx.arguments.get("message_id")?.value?.toString()
        if(id) {
            let res = await ctx.sql.query(`SELECT * FROM giveaways WHERE id='${id}'`).catch(() => null)

            if(!res || !res.rows.length) return ctx.error("Unable to find that giveaway")

            let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle("Giveaway info:")
            .setDescription(`[This giveaway](https://discord.com/channels/${ctx.interaction.guildId}/${res.rows[0].channel_id}/${res.rows[0].id})`)
            .addFields([
                {name: "**ID**", value: id, inline: true},
                {name: "**Winners**", value: `${res.rows[0].winners}`, inline: true},
                {name: "**Participants**", value: `${ctx.client.giveawayCache.get(id)!.length}`, inline: true},
                {name: "**Ends**", value: `<t:${Math.floor((res.rows[0].duration)/1000)}:R>`, inline: true}
            ])
            
            ctx.reply({embeds: [embed], ephemeral: true})
        } else {
            let res = await ctx.sql.query(`SELECT * FROM giveaways`)

            let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle("Active giveaways")
            .setDescription(`${res.rows.map((r, i) => `**${i+1}** [click here](https://discord.com/channels/${ctx.interaction.guildId}/${r.channel_id}/${r.id}) <t:${Math.floor(r.duration/1000)}:R> **${r.users.length}** entries`).join("\n")}`)
        
            ctx.reply({embeds: [embed], ephemeral: true})
        }
    }
}