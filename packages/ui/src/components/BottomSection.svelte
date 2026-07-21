<script lang="ts">
  import { onMount } from 'svelte';
  import { lastDigestRunAt } from '@utils';
  import BottomTile from './BottomTile.svelte';
  import TimerTile from './TimerTile.svelte';
  import TimeTile from './TimeTile.svelte';

  const {
    newsSourcesCount,
    pusherKey,
    pusherCluster,
  }: { newsSourcesCount: number; pusherKey?: string | null; pusherCluster?: string | null } = $props();

  let utc = $state(false);

  // '----' until the presence channel connects (or if Pusher isn't configured).
  let currentVisitors = $state('----');

  onMount(() => {
    if (!pusherKey || !pusherCluster) return;

    let cancelled = false;
    let client: any;

    import('pusher-js').then(({ default: Pusher }) => {
      if (cancelled) return;
      client = new Pusher(pusherKey, { cluster: pusherCluster, authEndpoint: '/api/pusher/auth' });
      const channel = client.subscribe('presence-visitors');

      channel.bind('pusher:subscription_succeeded', (members: { count: number }) => {
        currentVisitors = String(members.count).padStart(4, '0');
      });
      channel.bind('pusher:member_added', () => {
        currentVisitors = String(Number(currentVisitors) + 1).padStart(4, '0');
      });
      channel.bind('pusher:member_removed', () => {
        currentVisitors = String(Math.max(0, Number(currentVisitors) - 1)).padStart(4, '0');
      });
    });

    return () => {
      cancelled = true;
      client?.disconnect();
    };
  });
</script>

<section class="-mt-[2px] border-t-2 border-black px-4 py-4 md:px-4">
  <div class="flex flex-wrap gap-4">
    <BottomTile header="Current Visitors" content={currentVisitors} />
    <TimerTile {utc} ontoggle={() => (utc = !utc)} />
    <BottomTile header="News Sources" content={String(newsSourcesCount)} />
    <TimeTile header="Last Digest" time={$lastDigestRunAt} {utc} ontoggle={() => (utc = !utc)} />
  </div>
</section>
