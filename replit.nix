{ pkgs }: {
  deps = [
    pkgs.iana-etc
    pkgs.mkinitcpio-nfs-utils
    pkgs.cope
    pkgs.unixtools.ping
  ];
}