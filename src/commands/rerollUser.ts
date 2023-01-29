import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder, Snowflake } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { randomizeArray } from "../classes/randomizer";
import { syncDB } from "../intervals/syncdb";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "reroll",
    description: "Rerolls a participants prize",
    options: [{
        type: ApplicationCommandOptionType.String,
        name: "message_id",
        description: "The id of the giveaway message",
        required: true
    },{
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "The user you want to remove",
        required: true
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Rerolls a participant`
    }
    async run(ctx: CommandContext): Promise<any> {
        const user = ctx.interaction.options.getUser("user", true)
        const id = ctx.interaction.options.getString("message_id", true)

        await ctx.deferReply({ephemeral: false})
        let giveaway = await ctx.sql.query(`SELECT * FROM giveaways WHERE id=$1`, [id])
        let key = await ctx.sql.query(`SELECT * FROM prizes WHERE id=$1`, [id])
        if(!key.rows.length) {
            return ctx.editReply({content: "Unable to find prize", components: [], embeds: []})
        }
        let pending_users = await ctx.sql.query(`SELECT * FROM prizes WHERE user_id IS NOT NULL`)
        // filters out pending users for other giveaways
        let users: string[] = giveaway.rows[0].users
            .filter((u: string) => !key.rows.find(r => r.user_id === u))
            .filter((u: string) => !giveaway.rows[0].won_users.includes(u))
            .filter((r: Snowflake) => !pending_users.rows.find(ro => ro.user_id === r))

        ctx.editReply({embeds: [], components: [], content: `Rerolling...`})
        
        if(!users.length) {
            let q = `DELETE FROM prizes WHERE user_id=$1 AND id=$2 RETURNING *`
            let left_over = await ctx.sql.query(q, [user.id, id])
            
            ctx.log(`${ctx.interaction.user.tag} (\`${user.id}\`) denied their prize (\`${left_over.rows[0].prize}\`) and no further winners could be determined.\n**GiveawayID** \`${id}\``)
            //give log not given away key
            ctx.editReply({embeds: [], components: [], content: `Unable to find any further winners`})
        } else {
            users = randomizeArray(users);
            let winners = users.splice(0, 1)
            await ctx.sql.query(`UPDATE prizes SET user_id=$1, changed=$2 WHERE user_id=$3`, [winners[0], Date.now(), user.id])
            let dms_closed: string[] = []
            
            let embed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle("🎉 You Won 🎉")
            .setDescription(`You won in [this giveaway](https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.rows[0].channel_id}/${id}). Do you want to accept your prize?`)

            let components = [{
                type: 1,
                components: [{
                    type: 2,
                    custom_id: `accept_${id}`,
                    label: "Accept",
                    style: 3
                },{
                    type: 2,
                    custom_id: `deny_${id}`,
                    label: "Deny",
                    style: 4
                }]
            }]

            while(winners.length) {
                let uid = winners.splice(0, 1)[0]
                let user = await ctx.client.users.fetch(uid)
                let res = await user.send({embeds: [embed], components}).catch(() => null)
                if(!res) {
                    if(users.length) {
                        let newid = users.splice(0, 1)[0]
                        winners.push(newid)
                        await ctx.sql.query(`UPDATE prizes SET user_id=$1 WHERE user_id=$2`, [newid, uid])
                    } else {
                        dms_closed.push(uid)
                    }
                }
            }

            if(dms_closed.length) {
                let q = `DELETE FROM prizes WHERE user_id IN (${dms_closed.map((_, i) => `$${i+2}`).join(", ")}) AND id=$1 RETURNING *`
                let left_over = await ctx.sql.query(q, [id, ...dms_closed])
                ctx.editReply({embeds: [], components: [], content: `Unable to find any further winners`})
                ctx.log(`${ctx.interaction.user.tag} (\`${user.id}\`) denied their prize (\`${left_over.rows[0].prize}\`) and no further winners could be determined.\n**GiveawayID** \`${id}\``)
            } else {
                ctx.editReply({embeds: [], components: [], content: `Rerolled prize`})
            }
        }
    }
}