import { ApplicationCommandData, Message, MessageAttachment, NewsChannel, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "delete",
    description: "Silently deletes a giveaway",
    options: [{
        type: "STRING",
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
        let id = ctx.arguments.get("message_id")?.value?.toString() ?? ""
        let res = await ctx.sql.query(`DELETE FROM giveaways WHERE id=$1 RETURNING *`, [id])
        let keys = await ctx.sql.query(`DELETE FROM prizes WHERE id=$1 RETURNING *`, [id])
        let file = new MessageAttachment(Buffer.from(keys.rows.map(r => r.prize).join("\n")), `${id}_keys.txt`)
        ctx.reply({content: `Ended giveaway with id \`${res.rows[0].id}\``, files: [file]})

        let channel = await ctx.client.channels.fetch(res.rows[0].channel_id).catch(() => null)
        let message: Message | undefined
        if(channel instanceof TextChannel || channel instanceof NewsChannel) {
            message = await channel.messages.fetch(id).catch(() => undefined)
            message?.delete().catch()
        }

        ctx.client.log(`${ctx.interaction.member?.user.username}#${ctx.interaction.member?.user.discriminator} deleted the giveaway \`${id}\` with ${res.rows[0].users} entries`, [file])
    }
}