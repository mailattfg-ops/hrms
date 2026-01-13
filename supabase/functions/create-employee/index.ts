import { createClient } from "@supabase/supabase-js";
// @ts-ignore
import { Resend } from "https://esm.sh/resend@2.0.0";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
// @ts-ignore
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

async function sendWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string,
  tempPassword: string,
  employeeId: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "HR <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to the Team! Your Account Details",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to the Team! 🎉</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi <strong>${firstName} ${lastName}</strong>,</p>
            
            <p style="font-size: 16px;">We're excited to have you join our team! Your employee account has been created successfully.</p>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Your Login Credentials</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Employee ID:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${employeeId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Temporary Password:</td>
                  <td style="padding: 8px 0;">
                    <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">${tempPassword}</code>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Important:</strong> Please change your password immediately after your first login for security purposes.
              </p>
            </div>
            
            <p style="font-size: 16px;">If you have any questions, please don't hesitate to reach out to the HR team.</p>
            
            <p style="font-size: 16px; margin-bottom: 0;">
              Best regards,<br>
              <strong>The HR Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      return { success: false, error };
    }

    console.log("Welcome email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}
// @ts-ignore
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the caller's token to verify their role
    // @ts-ignore
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // @ts-ignore
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    // @ts-ignore
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the caller's user
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      console.error("Failed to get caller:", callerError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is admin or HR using the security definer function
    const { data: isAdminOrHr, error: roleError } = await callerClient.rpc("is_admin_or_hr", {
      _user_id: caller.id,
    });

    if (roleError || !isAdminOrHr) {
      console.error("Role check failed:", roleError);
      return new Response(
        JSON.stringify({ error: "Only Admin or HR can add employees" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      employeeId,
      firstName,
      lastName,
      email,
      departmentId,
      employmentType,
      dateOfJoining,
      gender,
      workLocation,
      state,
    } = body;

    // Validate required fields
    if (!employeeId || !firstName || !lastName || !email || !departmentId || !dateOfJoining) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";

    let userId: string;
    let isExistingUser = false;

    // Try to create the user using admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) {
      // Check if user already exists
      if (authError.code === "email_exists") {
        console.log("User already exists, looking up existing user...");

        // Find existing user by email
        const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();

        if (listError) {
          console.error("Error listing users:", listError);
          return new Response(
            JSON.stringify({ error: "Failed to lookup existing user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const existingUser = existingUsers.users.find(
          (u: any) => u.email === email
        );

        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: "Could not find existing user with this email" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if this user already has an employee record
        const { data: existingEmployee } = await adminClient
          .from("employees")
          .select("id")
          .eq("user_id", existingUser.id)
          .single();

        if (existingEmployee) {
          return new Response(
            JSON.stringify({ error: "This user already has an employee record" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        userId = existingUser.id;
        isExistingUser = true;
        console.log("Using existing user:", userId);
      } else {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (!authData.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      userId = authData.user.id;
    }

    console.log("User ID:", userId, isExistingUser ? "(existing)" : "(new)");

    // Create employee record using admin client (bypasses RLS)
    const { data: employee, error: empError } = await adminClient
      .from("employees")
      .insert({
        user_id: userId,
        employee_id: employeeId,
        department_id: departmentId,
        employment_type: employmentType || "full_time",
        date_of_joining: dateOfJoining,
        gender: gender || null,
        work_location: workLocation || null,
        state: state || null,
      })
      .select()
      .single();

    if (empError) {
      console.error("Employee insert error:", empError);
      // Try to clean up the created user only if it was newly created
      if (!isExistingUser) {
        await adminClient.auth.admin.deleteUser(userId);
      }
      return new Response(
        JSON.stringify({ error: empError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Employee created:", employee.id);

    // Send welcome email with credentials only for new users
    let emailResult = { success: false };
    if (!isExistingUser) {
      emailResult = await sendWelcomeEmail(
        email,
        firstName,
        lastName,
        tempPassword,
        employeeId
      );

      if (!emailResult.success) {
        console.warn("Welcome email failed but employee was created:", emailResult);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        employeeId: employee.id,
        tempPassword: isExistingUser ? null : tempPassword,
        emailSent: emailResult.success,
        isExistingUser,
        message: isExistingUser
          ? "Employee record created and linked to existing user account."
          : emailResult.success
            ? "Employee created successfully. Welcome email sent."
            : "Employee created successfully. Share the credentials manually."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
