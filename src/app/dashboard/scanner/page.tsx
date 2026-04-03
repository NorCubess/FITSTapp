"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/lib/supabase/client";
import type { Member, Membership } from "@/lib/supabase/database";

export default function ScannerPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  // Cooldown flag
  const cooldownRef = useRef<boolean>(false);

  const handleMemberScanRef = useRef<(id: string) => Promise<void>>(null!);

  handleMemberScanRef.current = async (memberId: string) => {
    // If cooldown is active, ignore this scan
    if (cooldownRef.current) return;

    // Activate cooldown
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 3000); // 3 seconds

    setError(null);
    setMember(null);
    setMembership(null);
    setValid(null);

    try {
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId)
        .single();

      if (memberError || !memberData) {
        setError("Member not found. UUID: " + memberId);
        return;
      }
      setMember(memberData as Member);

      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("*")
        .eq("member_id", memberId)
        .single();

      if (membershipError || !membershipData) {
        setError("Membership not found for this member.");
        return;
      }

      const ms = membershipData as Membership;
      setMembership(ms);

      const isDateExpired =
        ms.end_date !== null &&
        ms.end_date !== undefined &&
        new Date(ms.end_date) < new Date();

      const isSessionsEmpty =
        ms.sessions_remaining !== null &&
        ms.sessions_remaining !== undefined &&
        ms.sessions_remaining <= 0;

      const isValid =
        ms.status === "active" && !isDateExpired && !isSessionsEmpty;

      setValid(isValid);

      if (!isValid) {
        setError("Membership is expired or has no sessions remaining.");
        return;
      }

      const { error: attendanceError } = await supabase
        .from("attendance")
        .insert({
          member_id: memberId,
          scanned_at: new Date().toISOString(),
          method: "qr",
        });

      if (attendanceError) {
        console.error("Attendance insert failed:", attendanceError.message);
      }

      if (ms.sessions_remaining !== null && ms.sessions_remaining !== undefined) {
        const { error: updateError } = await supabase
          .from("memberships")
          .update({ sessions_remaining: ms.sessions_remaining - 1 })
          .eq("id", ms.id);

        if (updateError) {
          console.error("Session decrement failed:", updateError.message);
        }
      }
    } catch (err) {
      setError("Unexpected error during scan.");
      console.error(err);
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText: string) => {
        handleMemberScanRef.current?.(decodedText.trim());
      },
      (errorMessage: string) => {
        console.warn("QR Scan Error:", errorMessage);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error("Failed to clear scanner:", err));
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">QR Scanner</h1>
      <div id="qr-reader" className="w-full max-w-md bg-white p-4 rounded shadow" />

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded w-full max-w-md">
          <p className="text-red-600 font-medium">Error</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      )}

      {member && membership && (
        <div
          className={`mt-6 p-6 rounded shadow w-full max-w-md ${
            valid ? "bg-green-100 border border-green-300" : "bg-red-100 border border-red-300"
          }`}
        >
          <p className={`text-sm font-bold uppercase mb-3 ${valid ? "text-green-700" : "text-red-700"}`}>
            {valid ? "✓ Valid Membership" : "✗ Invalid Membership"}
          </p>
          <h2 className="text-lg font-semibold mb-2">{member.full_name}</h2>
          <p className="text-sm mb-1">Type: {membership.type}</p>
          <p className="text-sm mb-1">Status: {membership.status}</p>
          <p className="text-sm mb-1">
            Expiry: {membership.end_date ?? "No expiry date set"}
          </p>
          <p className="text-sm mb-1">
            Sessions: {membership.sessions_remaining ?? "Unlimited (date-based)"}
          </p>
        </div>
      )}
    </div>
  );
}