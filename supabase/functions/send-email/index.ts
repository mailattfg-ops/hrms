// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// @ts-ignore
import { Resend } from "npm:resend";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
    to: string;
    templateName: string;
    data?: Record<string, string>;
}

// --- Init Resend ---
// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not defined");
const resend = new Resend(RESEND_API_KEY);

// @ts-ignore
Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        return new Response(
            JSON.stringify({ success: false, error: "Unauthorized" }),
            { status: 401, headers: corsHeaders }
        );
    }

    try {
        // --- Supabase service client ---
        // @ts-ignore
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        // @ts-ignore
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceKey);

        // --- Parse body ---
        const { to, templateName, data }: EmailRequest = await req.json();
        if (!to || !templateName) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid request body" }),
                { status: 400, headers: corsHeaders }
            );
        }

        // --- Load sender config ---
        const { data: smtpConfig, error: smtpError } = await supabase
            .from("smtp_email_config")
            .select("*")
            .eq("enabled", true)
            .single();

        if (smtpError || !smtpConfig) {
            throw new Error("SMTP configuration not found");
        }

        // --- Load email template ---
        const { data: template, error: templateError } = await supabase
            .from("email_templates")
            .select("*")
            .eq("name", templateName)
            .eq("status", "active")
            .single();

        if (templateError || !template) {
            throw new Error("Email template not found");
        }

        // --- Replace variables ---
        let subject = template.subject;
        let body = template.body;

        Object.entries(data || {}).forEach(([key, value]) => {
            subject = subject.replaceAll(`{{${key}}}`, value);
            body = body.replaceAll(`{{${key}}}`, value);
        });

        // --- Construct sender ---
        const from = `"${smtpConfig.from_name}" <${smtpConfig.from_email}>`;

        // --- Send email via Resend ---
        const res = await resend.emails.send({
            from,
            to,
            subject,
            html: body,
        });

        console.log("RESEND_API_KEY:", RESEND_API_KEY);
        console.log("Resend response:", JSON.stringify(res, null, 2));

        // ❌ Handle Resend error
        if (res.error) {
            console.error("Resend error:", res.error);

            return new Response(
                JSON.stringify({
                    success: false,
                    error: res.error.message,
                }),
                {
                    status: res.error.statusCode || 500,
                    headers: corsHeaders,
                }
            );
        }

        // ✅ Success
        console.log("Email sent successfully. ID:", res.data?.id);

        return new Response(
            JSON.stringify({
                success: true,
                email_id: res.data?.id,
                message: "Email sent successfully",
            }),
            { status: 200, headers: corsHeaders }
        );

    } catch (error: any) {
        console.error("Send email exception:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Internal server error",
            }),
            { status: 500, headers: corsHeaders }
        );
    }
});
