// Deep-link association files for iOS Universal Links / Android App Links.
// TODO: Replace TEAMID with iOS team ID when Capacitor project exists
// TODO: Replace REPLACE_WITH_SIGNING_CERT_SHA256 with Android signing cert SHA256

export const appleAppSiteAssociation = {
  applinks: {
    apps: [],
    details: [
      {
        appIDs: ["TEAMID.dev.digitalglue.routefast"],
        paths: ["/user/magic", "/user/reset-password"],
      },
    ],
  },
  webcredentials: {
    apps: ["TEAMID.dev.digitalglue.routefast"],
  },
};

export const androidAssetLinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "dev.digitalglue.routefast",
      sha256_cert_fingerprints: ["REPLACE_WITH_SIGNING_CERT_SHA256"],
    },
  },
];
