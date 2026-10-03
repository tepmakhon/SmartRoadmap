import { userApi } from '../api/domains';
import { useAction, useData } from '../hooks/data';
import { useAuth } from '../app/providers';
import { Card, PageHeader, PageState, Avatar, EntityForm } from '../components/ui';
import type { Input } from '../types';
export default function ProfilePage() {
  const auth = useAuth();
  const profile = useData(['profile'], userApi.profile);
  const save = useAction(userApi.updateProfile, 'Your profile is updated.');
  return (
    <>
      <PageHeader
        eyebrow="THE PERSON BEHIND THE PROGRESS"
        title="Your profile"
        description="Make your learning space feel a little more like you."
      />
      <PageState query={profile}>
        {profile.data && (
          <div className="profile-layout">
            <Card className="profile-summary">
              <Avatar
                name={profile.data.full_name || auth.user?.username || 'You'}
                url={profile.data.avatar_url}
              />
              <h2>{profile.data.full_name || auth.user?.username}</h2>
              <p>@{auth.user?.username}</p>
              <span>{auth.user?.email}</span>
              <p>{profile.data.bio || 'Your next chapter is yours to write.'}</p>
            </Card>
            <Card>
              <div className="section-heading">
                <div>
                  <h2>Personal details</h2>
                  <p>A little context for your learning journey.</p>
                </div>
              </div>
              <EntityForm<Input<'UserProfileUpdate'>>
                key={profile.data.updated_at}
                initial={profile.data}
                fields={[
                  { name: 'full_name', label: 'Full name', max: 100 },
                  { name: 'location', label: 'Location', max: 150 },
                  { name: 'bio', label: 'About you', type: 'textarea', max: 2000 },
                  {
                    name: 'avatar_url',
                    label: 'Avatar URL',
                    type: 'url',
                    max: 500,
                    hint: 'Use a public HTTPS image URL.',
                  },
                  { name: 'phone', label: 'Phone', max: 30 },
                  { name: 'date_of_birth', label: 'Date of birth', type: 'date' },
                ]}
                submit={(data) => save.mutateAsync(data)}
                label="Save profile"
              />
            </Card>
          </div>
        )}
      </PageState>
    </>
  );
}
