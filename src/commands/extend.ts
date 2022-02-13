import { ApplicationCommandData, Message, MessageAttachment, MessageEmbed, NewsChannel, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { determineWinner } from "../intervals/determineWinners";
import { syncDB } from "../intervals/syncdb";
import request from "petitio"

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "extend",
    description: "Extends the duration of a giveaway",
    options: [{
        type: "STRING",
        name: "message_id",
        description: "The id of the giveaway message",
        required: true
    },{
        type: "INTEGER",
        name: "duration",
        description: "The hours you want to extend the giveaway by",
        required: true
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Extends a giveaway`
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.arguments.get("message_id")?.value?.toString() ?? ""
        let duration = Number(ctx.arguments.get("duration")?.value)
        if(duration < 0) return ctx.error("Please give a positive number")
        let giveaway = await ctx.sql.query(`SELECT * FROM giveaways WHERE id=$1 AND NOT rolled`, [id])
        if(!giveaway.rowCount) return ctx.error("There is no active giveaway with that id")
        let keys = await ctx.sql.query(`UPDATE giveaways SET duration = ${Number(giveaway.rows[0].duration)+(duration*60*60*1000)} WHERE id=$1 AND NOT rolled RETURNING *`, [id]).catch(() => null)
        if(!keys?.rowCount) return ctx.error("There is no active giveaway with that id")
        let channel = await ctx.client.channels.fetch(keys.rows[0].channel_id)
        if(channel?.isText()) {
            await channel.messages.fetch(keys.rows[0].id).then(m => {
                let embed = new MessageEmbed()
                .setColor("AQUA")
                .setTitle(m.embeds[0].title ?? "New giveaway")
                .setDescription(`${m.embeds[0].description?.split("\n")[0] ?? `**Prize** unknown`}\n**Winners** ${keys!.rows[0].winners}\n**Ends** <t:${Math.floor((keys!.rows[0].duration)/1000)}:R>\n\n**To claim your prize simply open your direct messages. The prize will be sent to you**`)
        
                m.edit({embeds: [embed]}).catch(() => null)
            })
        }
        ctx.reply({content: `Giveaway extended by ${duration} hours`})

        ctx.client.log(`${ctx.interaction.user.username}#${ctx.interaction.user.discriminator} (\`${ctx.interaction.user.id}\`) extended the giveaway by ${duration} hours`)
    }
}