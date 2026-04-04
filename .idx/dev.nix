{ pkgs, ... }: {
  packages = [
    pkgs.nodejs_20
  ];

  idx = {
    workspace = {
      onCreate = {
        install = "npm install";
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "npm" "run" "dev" ];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };
  };
}
