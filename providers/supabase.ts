import { createClient } from '@supabase/supabase-js'
import dotenv from "dotenv";
dotenv.config();

export const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_KEY as string,
);

export const insertRow = async (table: string, data: Record<string, any>) => {
    return supabase.from(table).insert([data]);
}

export const getRow = async (table: string, selector: string, value: string) => {
    return supabase.from(table).select('*').eq(selector, value).single()
}