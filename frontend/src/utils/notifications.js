export const checkForNewAppointments = async (user) => {
  if (!user) return 0;

  try {
    const response = await api.get("/appointments/");
    const myAppointments = response.data.filter(
      (app) => app.user === user.username && app.status === "pending"
    );

    return myAppointments.length;
  } catch (error) {
    console.error("Error checking notifications:", error);
    return 0;
  }
};
