// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// @ts-ignore
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
    to: string;
    templateName: string;
    data: Record<string, string>;
}

serve(async (req: any) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    console.log("mail sent");
    try {
        const { to, templateName, data }: EmailRequest = await req.json();
        console.log("mail sent1");

        const supabase = createClient(
            // @ts-ignore
            Deno.env.get("SUPABASE_URL") ?? "",
            // @ts-ignore
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        console.log("mail sent2");


        // 1. Get SMTP Configuration
        const { data: smtpConfig, error: smtpError } = await supabase
            .from("smtp_email_config")
            .select("*")
            .maybeSingle();
        console.log("mail sent3", smtpConfig);

        if (smtpError || !smtpConfig) {
            throw new Error("SMTP configuration not found or disabled");
        }

        // 2. Get Email Template
        const { data: template, error: templateError } = await supabase
            .from("email_templates")
            .select("*")
            .eq("name", templateName)
            .eq("status", "active")
            .maybeSingle();
        console.log("mail sent4", template);

        if (templateError || !template) {
            console.error("Template error:", templateError);
            // Fallback or error? For now, let's error to be explicit
            throw new Error(`Email template '${templateName}' not found or not active`);
        }
        console.log("mail sent5", template);

        // 3. Replace variables in Subject and Body
        let subject = template.subject;
        let body = template.body;

        Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, "g");
            subject = subject.replace(regex, value);
            body = body.replace(regex, value);
        });

        // 4. Configure Transporter
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.encryption === "ssl", // true for 465, false for other ports
            auth: {
                user: smtpConfig.username,
                pass: smtpConfig.password,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        console.log("mail sent5", transporter);

        // 5. Send Email
        const info = await transporter.sendMail({
            from: `"${smtpConfig.from_name}" <${smtpConfig.from_email}>`,
            to: to,
            replyTo: smtpConfig.reply_to || undefined,
            subject: subject,
            text: body, // TODO: Enhance to support HTML if the template stores HTML
            // html: body 
        });

        console.log("Message sent: %s", info.messageId);

        return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
