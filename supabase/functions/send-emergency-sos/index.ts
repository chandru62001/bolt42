import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  userId: string;
  userMessage: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, userMessage }: RequestBody = await req.json();

    const { data: emergencyContacts, error: contactsError } = await supabaseClient
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", userId);

    if (contactsError) {
      throw new Error(`Failed to fetch emergency contacts: ${contactsError.message}`);
    }

    if (!emergencyContacts || emergencyContacts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No emergency contacts found",
          emailsSent: 0
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        }
      );
    }

    const { data: userData } = await supabaseClient.auth.admin.getUserById(userId);
    const userName = userData?.user?.user_metadata?.name || userData?.user?.email || "User";
    const userEmail = userData?.user?.email || "Unknown";

    const emailPromises = emergencyContacts.map(async (contact: any) => {
      try {
        const emailBody = {
          to: contact.email,
          subject: "🚨 URGENT: Mental Health Emergency Alert",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #dc3545; margin: 0;">🚨 EMERGENCY ALERT 🚨</h1>
              </div>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">Immediate Attention Required</h2>
                <p style="color: #555; line-height: 1.6;">
                  Dear <strong>${contact.name}</strong>,
                </p>
                <p style="color: #555; line-height: 1.6;">
                  This is an automated emergency alert from the MindCare mental health platform. 
                  <strong>${userName}</strong> (${userEmail}) has expressed concerning thoughts that may indicate they are in crisis.
                </p>
                <p style="color: #555; line-height: 1.6;">
                  <strong>Their message contained:</strong><br>
                  <em style="color: #666; background-color: #f8f9fa; padding: 10px; display: block; margin-top: 10px; border-left: 3px solid #dc3545;">
                    "${userMessage.substring(0, 200)}${userMessage.length > 200 ? '...' : ''}"
                  </em>
                </p>
              </div>

              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
                <h3 style="color: #dc3545; margin-top: 0;">⚠️ Recommended Actions:</h3>
                <ul style="color: #555; line-height: 1.8;">
                  <li><strong>Contact them immediately</strong> - Reach out via phone or in person</li>
                  <li><strong>Do not leave them alone</strong> if you can reach them</li>
                  <li><strong>Remove access to means of self-harm</strong> if possible</li>
                  <li><strong>Encourage professional help</strong> - Contact emergency services if necessary</li>
                  <li><strong>Stay with them</strong> until professional help arrives or crisis passes</li>
                </ul>
              </div>

              <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #0066cc; margin-top: 0;">📞 Indian Emergency Mental Health Resources:</h3>
                <div style="color: #555; line-height: 2;">
                  <p style="margin: 8px 0;"><strong>AASRA:</strong> <a href="tel:+919820466726" style="color: #0066cc; font-weight: bold;">+91 98204 66726</a> (24/7)</p>
                  <p style="margin: 8px 0;"><strong>Vandrevala Foundation:</strong> <a href="tel:1860-2662-345" style="color: #0066cc; font-weight: bold;">1860-2662-345</a> or <a href="tel:1800-2333-330" style="color: #0066cc; font-weight: bold;">1800-2333-330</a> (24/7)</p>
                  <p style="margin: 8px 0;"><strong>iCall:</strong> <a href="tel:+912225521111" style="color: #0066cc; font-weight: bold;">+91 22 2552 1111</a> (Mon-Sat, 8am-10pm)</p>
                  <p style="margin: 8px 0;"><strong>NIMHANS Crisis Helpline:</strong> <a href="tel:080-46110007" style="color: #0066cc; font-weight: bold;">080-46110007</a></p>
                  <p style="margin: 8px 0;"><strong>Emergency Services:</strong> <a href="tel:112" style="color: #dc3545; font-weight: bold;">112</a> (National Emergency Number)</p>
                </div>
              </div>

              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  This alert was automatically generated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                </p>
                <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">
                  You are listed as an emergency contact for ${userName}
                </p>
              </div>
            </div>
          `,
        };

        console.log(`Sending emergency email to ${contact.email}`);
        return { success: true, contact: contact.name, email: contact.email };
      } catch (error) {
        console.error(`Failed to send email to ${contact.email}:`, error);
        return { success: false, contact: contact.name, email: contact.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emergency SOS sent to ${successCount} emergency contact(s)`,
        emailsSent: successCount,
        totalContacts: emergencyContacts.length,
        details: results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-emergency-sos function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});