import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import api from "../api";
import Swal from "sweetalert2";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const seenNotificationsRef = useRef(new Set()); // Pamti šta je već viđeno

  useEffect(() => {
    if (!user) return;

    console.log("🎯 Notification system started for:", user.username);

    const showNewNotifications = async () => {
      try {
        // Učitaj prethodno viđene notifikacije iz localStorage
        const storedSeen = localStorage.getItem(
          `seen_notifications_${user.username}`
        );
        if (storedSeen) {
          seenNotificationsRef.current = new Set(JSON.parse(storedSeen));
        }

        // Za ownere - prikaži samo NOVE pending rezervacije
        if (user.role === "owner") {
          const res = await api.get("/owner/appointments/");
          const pendingAppointments = res.data.filter(
            (app) => app.status === "pending"
          );

          const newPending = pendingAppointments.filter(
            (app) =>
              !seenNotificationsRef.current.has(`owner_pending_${app.id}`)
          );

          if (newPending.length > 0) {
            Swal.fire({
              title: `🔔 ${newPending.length} nova rezervacija!`,
              html: `
                <div style="text-align: left; font-size: 14px;">
                  <p>Imate <strong>${newPending.length}</strong> novih rezervacija na čekanju.</p>
                  <small>Idite na "Rezervacije" tab da ih pregledate.</small>
                </div>
              `,
              icon: "info",
              position: "top-end",
              timer: 6000,
              showConfirmButton: false,
            });

            // Označi kao viđeno
            newPending.forEach((app) => {
              seenNotificationsRef.current.add(`owner_pending_${app.id}`);
            });
            saveSeenNotifications();
          }
        }

        // Za usere - prikaži samo NOVE odobrene/odbijene rezervacije
        if (user.role === "player") {
          const res = await api.get("/appointments/");
          const myAppointments = res.data.filter(
            (app) => app.user === user.username
          );

          const newApproved = myAppointments.filter(
            (app) =>
              app.status === "approved" &&
              !seenNotificationsRef.current.has(`user_approved_${app.id}`)
          );

          const newRejected = myAppointments.filter(
            (app) =>
              app.status === "rejected" &&
              !seenNotificationsRef.current.has(`user_rejected_${app.id}`)
          );

          // Prikaži notifikacije za nove odobrene
          if (newApproved.length > 0) {
            setTimeout(() => {
              Swal.fire({
                title: "✅ Rezervacija odobrena!",
                html: `
                  <div style="text-align: left; font-size: 14px;">
                    <p>Imate <strong>${newApproved.length}</strong> novih odobrenih rezervacija.</p>
                    <small>Idite na "Moje Rezervacije" da vidite detalje.</small>
                  </div>
                `,
                icon: "success",
                position: "top-end",
                timer: 6000,
                showConfirmButton: false,
              });

              // Označi kao viđeno
              newApproved.forEach((app) => {
                seenNotificationsRef.current.add(`user_approved_${app.id}`);
              });
              saveSeenNotifications();
            }, 2000);
          }

          // Prikaži notifikacije za nove odbijene
          if (newRejected.length > 0) {
            setTimeout(
              () => {
                Swal.fire({
                  title: "❌ Rezervacija odbijena",
                  html: `
                  <div style="text-align: left; font-size: 14px;">
                    <p>Imate <strong>${newRejected.length}</strong> novih odbijenih rezervacija.</p>
                    <small>Idite na "Moje Rezervacije" da vidite detalje.</small>
                  </div>
                `,
                  icon: "error",
                  position: "top-end",
                  timer: 6000,
                  showConfirmButton: false,
                });

                // Označi kao viđeno
                newRejected.forEach((app) => {
                  seenNotificationsRef.current.add(`user_rejected_${app.id}`);
                });
                saveSeenNotifications();
              },
              newApproved.length > 0 ? 4000 : 2000
            ); // Ako ima i approved, delay
          }
        }
      } catch (error) {
        console.error("Error showing notifications:", error);
      }
    };

    // Sačuvaj seen notifikacije u localStorage
    const saveSeenNotifications = () => {
      localStorage.setItem(
        `seen_notifications_${user.username}`,
        JSON.stringify([...seenNotificationsRef.current])
      );
    };

    // Pokreni notifikacije nakon 2 sekunde
    setTimeout(showNewNotifications, 2000);
  }, [user]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
