@echo off
title Start - Tracker Server
color 0A

echo =======================================================
echo          ZAPINAM LOKALNI SERVER PRO TRACK.CZ
echo =======================================================
echo.
echo Server uspesne bezi!
echo.
echo Kde si muzes Tracker otevrit:
echo 1) Na tomto pocitaci:  http://localhost
echo 2) Pokud jsi upravil hosts: http://track.cz
echo 3) Na mobilu (stejna Wi-Fi): http://192.168.0.9
echo.
echo Dulezite: Nezavirej toto cerne okno, dokud chces, aby 
echo Tracker fungoval. Pro vypnuti okno proste zavri (krizkem).
echo =======================================================
echo.

:: Spusteni vlastniho Python weboveho a API serveru na portu 80
python server.py

pause
