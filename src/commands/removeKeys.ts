import { ApplicationCommandData, Message, MessageAttachment, MessageEmbed, NewsChannel, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { determineWinner } from "../intervals/determineWinners";
import { syncDB } from "../intervals/syncdb";
import request from "petitio"

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "removekeys",
    description: "Removes pending keys for a giveaway from handout process",
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
        this.description = `Removes all keys from a handout process`
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.arguments.get("message_id")?.value?.toString() ?? ""
        let keys = await ctx.sql.query(`DELETE FROM prizes WHERE id=$1 AND user_id IS NOT NULL RETURNING *`, [id])
        if(!keys.rowCount) return ctx.error("No keys for that giveaway found")
        let file = new MessageAttachment(Buffer.from(keys.rows.map(r => r.prize).join("\n")), `${id}_keys.txt`)
        ctx.reply({content: `You removed ${keys.rowCount} pending keys from giveaway ${id}`, files: [file]})


        ctx.client.log(`${ctx.interaction.user.username}#${ctx.interaction.user.discriminator} (\`${ctx.interaction.user.id}\`) deleted the ${keys.rowCount} pending prizes for the giveaway \`${id}\``, [file])
    }
}