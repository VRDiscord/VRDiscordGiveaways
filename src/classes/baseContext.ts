import { Message, MessageEmbed } from "discord.js";
import { GiveawayClient } from "./client";
import pg from "pg"

export class BaseContext{
    client: GiveawayClient
    sql: pg.Client
    constructor(client: GiveawayClient, sql: pg.Client){
        this.client = client
        this.sql = sql
    }

    async log(message: string | MessageEmbed | MessageEmbed[]): Promise<Message | null> {
        return await this.client.log(message)
    }

    getTime(string: string): number{
        if(!/\d+[mhdw]/.test(string)) return 0
        if(string.includes("m")) return Number(string.replace("m", ""))*60*1000
        if(string.includes("h")) return Number(string.replace("h", ""))*60*60*1000
        if(string.includes("d")) return Number(string.replace("d", ""))*24*60*60*1000
        if(string.includes("w")) return Number(string.replace("w", ""))*7*24*60*60*1000
        return 0
    }
}