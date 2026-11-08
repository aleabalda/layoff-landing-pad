import AppHeader from "../../components/AppHeader";
import FriendsList from "./FriendsList";
import JobTracker from "./JobTracker";
import ProfileDetails from "./ProfileDetails";
import WinsProgress from "./WinsProgress";

function Profile() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-5 px-4 pb-12">
        <ProfileDetails />
        <FriendsList />

        <h2 className="px-1 pt-4 text-lg font-semibold tracking-tight text-slate-900">
          Your progress
        </h2>
        <WinsProgress />
        <JobTracker />
      </main>
    </div>
  );
}

export default Profile;
