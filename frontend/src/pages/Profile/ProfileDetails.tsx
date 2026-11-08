import { useState } from "react";
import ProfileEditForm from "./ProfileEditForm";
import ProfileSummary from "./ProfileSummary";

function ProfileDetails() {
  const [isEditing, setIsEditing] = useState(false);

  return isEditing ? (
    <ProfileEditForm onDone={() => setIsEditing(false)} />
  ) : (
    <ProfileSummary onEdit={() => setIsEditing(true)} />
  );
}

export default ProfileDetails;
