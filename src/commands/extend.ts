import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "extend",
    description: "Extends the duration of a giveaway",
    options: [{
        type: ApplicationCommandOptionType.String,
        name: "message_id",
        description: "The id of the giveaway message",
        required: true
    },{
        type: ApplicationCommandOptionType.Number,
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
        const id = ctx.interaction.options.getString("message_id", true)
        const duration = ctx.interaction.options.getNumber("duration", true)
        if(duration < 0) return ctx.error("Please give a positive number")
        let giveaway = await ctx.sql.query(`SELECT * FROM giveaways WHERE id=$1 AND NOT rolled`, [id])
        if(!giveaway.rowCount) return ctx.error("There is no active giveaway with that id")
        let keys = await ctx.sql.query(`UPDATE giveaways SET duration = $2 WHERE id=$1 AND NOT rolled RETURNING *`, [id, (Number(giveaway.rows[0].duration)+(duration*60*60*1000))]).catch(() => null)
        if(!keys?.rowCount) return ctx.error("There is no active giveaway with that id")
        let channel = await ctx.client.channels.fetch(keys.rows[0].channel_id)
        if(channel?.isTextBased()) {
            await channel.messages.fetch(keys.rows[0].id).then(m => {
                let embed = new EmbedBuilder()
                .setColor(Colors.Aqua)
                .setTitle(m.embeds[0].title ?? "New giveaway")
                .setDescription(`${m.embeds[0].description?.split("\n")[0] ?? `**Prize** unknown`}\n**Winners** ${keys!.rows[0].winners}\n**Ends** <t:${Math.floor((keys!.rows[0].duration)/1000)}:R>\n\n**To claim your prize simply open your direct messages. The prize will be sent to you**`)
        
                m.edit({embeds: [embed]}).catch(() => null)
            })
        }
        ctx.reply({content: `Giveaway extended by ${duration} hours`})

        ctx.client.log(`${ctx.interaction.user.username} (\`${ctx.interaction.user.id}\`) extended the giveaway "${keys.rows[0].name}" \`${id}\` by ${duration} hours`, undefined, [{type: 1, components: [{type: 2, label: "View Message", style: 5, url: `https://discord.com/channels/${process.env["GUILD_ID"]}/${keys.rows[0].channel_id}/${keys.rows[0].id}`}]}])
    }
}