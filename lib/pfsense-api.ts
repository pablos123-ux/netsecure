// Placeholder pfSense API client to satisfy type-checking/build.
// Replace with real HTTP/RPC calls to pfSense when available.

type BlockResult = { success: boolean; message?: string };

const pfsense = {
  async getTotalBandwidthMbps(): Promise<number> {
    // Return 0 by default; integrate with pfSense metrics later.
    return 0;
  },

  async blockUser(userId: string): Promise<BlockResult> {
    // Implement real block logic (pfSense firewall rule) here.
    return { success: true, message: `Blocked user ${userId}` };
  },

  async unblockUser(userId: string): Promise<BlockResult> {
    // Implement real unblock logic here.
    return { success: true, message: `Unblocked user ${userId}` };
  },
};

export default pfsense;