const notifications = [
  "New application received for Frontend Revamp project",
  "Developer B submitted Backend API project",
  "Project Mobile App UI marked as completed",
  "You have 2 unread messages from developers",
];

const CompanyNotifications = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Notifications</h1>

      <div className="space-y-3">
        {notifications.map((note, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow p-4"
          >
            {note}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyNotifications;
