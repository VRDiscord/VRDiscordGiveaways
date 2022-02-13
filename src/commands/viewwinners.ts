import { ApplicationCommandData, MessageAttachment } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "viewwinners",
    description: "Shows winners of a giveaway",
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
        this.description = `Shows winners`
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.arguments.get("message_id")?.value?.toString() ?? ""
        let keys = await ctx.sql.query(`SELECT * FROM giveaways WHERE id=$1 AND rolled`, [id])
        if(!keys.rowCount) return ctx.error("No finished giveaways found from that id")
        if(!keys.rows[0].won_users.length) return ctx.error("No users have accepted their prize yet")
        let file = new MessageAttachment(Buffer.from(keys.rows[0].won_users.join("\n")), `${id}_winners.txt`)
        ctx.reply({content: `${keys.rows[0].won_users.length} winners who accepted attached below`, files: [file]})
    }
}