import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, Message, AttachmentBuilder, NewsChannel, TextChannel } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "delete",
    description: "Silently deletes a giveaway",
    options: [{
        type: ApplicationCommandOptionType.String,
        name: "message_id",
        description: "The id of the giveaway message",
        required: true
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Deletes a giveaway`
    }
    async run(ctx: CommandContext): Promise<any> {
        const id = ctx.interaction.options.getString("message_id", true)
        let res = await ctx.sql.query(`DELETE FROM giveaways WHERE id=$1 RETURNING *`, [id])
        let keys = await ctx.sql.query(`DELETE FROM prizes WHERE id=$1 RETURNING *`, [id])
        let file
        if(keys.rowCount) file = new AttachmentBuilder(Buffer.from(keys.rows.map(r => r.prize).join("\n")), {name: `${id}_keys.txt`})
        ctx.reply({content: `Ended giveaway with id \`${res.rows[0].id}\``, files: file ? [file] : undefined, ephemeral: true})

        let channel = await ctx.client.channels.fetch(res.rows[0].channel_id).catch(() => null)
        let message: Message | undefined
        if(channel instanceof TextChannel || channel instanceof NewsChannel) {
            message = await channel.messages.fetch(id).catch(() => undefined)
            message?.delete().catch()
        }

        ctx.client.log(`${ctx.interaction.user.username} deleted the giveaway "${res.rows[0].name}" \`${id}\` with ${res.rows[0].users.length} entries`, file ? [file] : undefined, [{type: 1, components: [{type: 2, label: "View Message", style: 5, url: `https://discord.com/channels/${process.env["GUILD_ID"]}/${res.rows[0].channel_id}/${res.rows[0].id}`}]}])
    }
}