import { ApplicationCommand, ChannelType, CommandInteraction, GuildMember, IntentsBitField } from "discord.js"
import { readFileSync, existsSync, readdirSync } from "fs"
import { GiveawayClient } from "./classes/client"
import { CommandContext } from "./classes/commandContext"
import pg from "pg"
import { ButtonContext } from "./classes/buttonContext"
import { syncDB } from "./intervals/syncdb"
import { determineWinner } from "./intervals/determineWinners"
import { rerollPrizes } from "./intervals/rerollPrizes"

const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/

if (existsSync(`${process.cwd()}/.env`))
    for (const line of readFileSync(`${process.cwd()}/.env`, 'utf8').split(/[\r\n]|\r\n/)) {
        let [, key, value] = line.match(RE_INI_KEY_VAL) || []
        if (!key) continue

        process.env[key] = value?.trim() || ''
}


const token = process.env["DISCORD_TOKEN"]
    , clientId = `${Buffer.from((token ?? "").split('.')[0] ?? "", 'base64')}`

const client = new GiveawayClient({
    intents: new IntentsBitField([
        "Guilds"
])})


let connection = new pg.Pool({
    user: process.env["DB_USERNAME"]!,
    host: process.env["DB_IP"]!,
    database: process.env["DB_NAME"]!,
    password: process.env["DB_PASSWORD"]!,
    port: Number(process.env["DB_PORT"]!),
})

readdirSync("./dist/commands")
.forEach(c => {
    const cmd = new ((require(`./commands/${c}`)).default)()
    cmd.client = client
    client.commands.set(cmd.name, cmd)
})

readdirSync("./dist/buttons")
.forEach(c => {
    const cmd = new ((require(`./buttons/${c}`)).default)()
    cmd.client = client
    client.buttons.set(cmd.name, cmd)
})

const keepAlive = async () => {
    //await connection.query("SELECT * FROM giveaways LIMIT 1").then(console.log).catch(() => null)
    //let res = await connection.query("DROP TABLE giveaways")
    //console.log(await connection.query("ALTER TABLE giveaways ADD name VARCHAR(1000) NOT NULL DEFAULT ''"))
    //console.log(await connection.query("ALTER TABLE giveaways ADD prize_description VARCHAR(1000) NOT NULL DEFAULT ''"))
    await connection.query("CREATE TABLE IF NOT EXISTS giveaways (id varchar(21) not null primary key, duration bigint not null, users text[] not null default '{}', won_users text[] default '{}', winners int not null, channel_id varchar(21) not null, rolled boolean not null, name VARCHAR(1000) NOT NULL DEFAULT '', prize_description VARCHAR(1000) NOT NULL DEFAULT '')")
    await connection.query("CREATE TABLE IF NOT EXISTS prizes (index SERIAL, id varchar(21) not null, prize varchar(255) not null, user_id varchar(21), changed bigint)")
    await connection.query("CREATE TABLE IF NOT EXISTS freekeys (index SERIAL, id varchar(21) not null, prize varchar(255) not null, user_id varchar(21), channel_id varchar(21) not null)")
}

const giveawayController = async () => {
    await syncDB(connection, client)
    await determineWinner(connection, client)
    await rerollPrizes(connection, client)
}

client.login(token)

connection.connect()
.then(async () => await keepAlive())
.then(async () => giveawayController())
.catch(console.error)

setInterval( giveawayController, 1000*60 )



client.on("interactionCreate", async (interaction): Promise<any> => {

    if(interaction.isCommand() && interaction.isChatInputCommand()) {
        if(interaction.channel?.type === ChannelType.DM)
        return (interaction as CommandInteraction).reply({content: "You can't use commands in DMs"})
        const command = client.commands.get(interaction.commandName)
        if(!command) return
        let member: GuildMember | undefined = undefined
        if(interaction.member?.permissions) {
            member = await interaction.guild?.members.fetch(interaction.member?.user.id!)!
        }
        const context = new CommandContext(client, interaction, member, connection)
        if(command.staffOnly && !member?.roles.cache.has(process.env["STAFF_ROLE_ID"]!)) return context.error("You are not staff")
        command.run(context).catch(console.error)
    } else if (interaction.isButton()) {
        const command = client.buttons.find(c => c.regex.test(interaction.customId))
        if(!command) return
        let member: GuildMember | undefined = undefined
        if(interaction.member?.permissions) {
            member = await interaction.guild?.members.fetch(interaction.member?.user.id!)!
        }
        const context = new ButtonContext(client, interaction, member, connection)
        if(command.staffOnly && !member?.roles.cache.has(process.env["STAFF_ROLE_ID"]!)) return context.error("You are not staff")
        command.run(context).catch(console.error)
    }
})

.on("ready", async () => {
    console.log(`Bot is ready - Logged in as ${client.user?.username}`)
    await client.application?.commands.set(client.commands.map(c => c.command), process.env["GUILD_ID"]!).catch(console.error)
})
