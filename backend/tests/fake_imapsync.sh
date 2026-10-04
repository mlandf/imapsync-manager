#!/bin/sh
# Simuliert die Ausgabe von imapsync für Tests.
case "$*" in *--fail*) echo "Err 1/50: login failed"; exit 16 ;; esac
case "$*" in *--slow*) sleep 30 ;; esac
echo "Host1 Nb folders:      2 folders"
echo "Host1 Nb messages:     4 messages"
echo "Host1 Total size:   4096 bytes (0.004 MiB)"
echo "Folder    1/2 [INBOX] -> [INBOX]"
echo "msg INBOX/1 {1024} copied to INBOX/1  2.00 msgs/s  0.001 MiB/s  0.001 MiB copied  ETA: Sat Oct  4 12:00:00 2026  3 s  3/4 msgs left"
echo "Folder    2/2 [Sent] -> [Sent]"
echo "msg Sent/1 {1024} copied to Sent/1  2.00 msgs/s  0.001 MiB/s  0.002 MiB copied  ETA: Sat Oct  4 12:00:00 2026  1 s  2/4 msgs left"
echo "Messages transferred :  2"
echo "Messages skipped     :  2"
echo "Total bytes transferred: 2048"
echo "Detected 0 errors"
exit 0
