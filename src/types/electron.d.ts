interface ElectronAPI {
  isElectron: boolean;
  platform: NodeJS.Platform;
  getVersion: () => Promise<string>;
  getAutoLaunch: () => Promise<boolean>;
  setAutoLaunch: (enabled: boolean) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
