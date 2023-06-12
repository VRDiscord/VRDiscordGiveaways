import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, Snowflake } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { randomizeArray } from "../classes/randomizer";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "chooserandom",
    description: "Chooses a random user that has not won",
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
        this.description = `Chooses a random user`
    }
    async run(ctx: CommandContext): Promise<any> {
        const id = ctx.interaction.options.getString("message_id", true)

        let giveaway = await ctx.sql.query(`SELECT * FROM giveaways WHERE id=$1`, [id])
        let pending_users = await ctx.sql.query(`SELECT * FROM prizes WHERE user_id IS NOT NULL`)
        let users = giveaway.rows[0].users.filter((u: string) => !giveaway.rows[0].won_users.includes(u)).filter((r: Snowflake) => !pending_users.rows.find(ro => ro.user_id === r))
        
        if(!users.length) {
            ctx.reply({embeds: [], components: [], content: `Unable to find any winners`})
        } else {
            users = randomizeArray(users);
            let winners = users.splice(0, 1)
            const user = await ctx.client.users.fetch(winners[0])
            ctx.reply({content: `Random user that has not won or accepting is pending the giveaway ${user.username} (\`${winners[0]}\`)`})
        }
    }
}