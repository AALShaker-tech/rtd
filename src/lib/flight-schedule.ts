/**
 * Static weekly flight schedule (NOT live data).
 * Source week: 2026-06-22 → 2026-06-28. Times are local to the origin airport.
 * "----" means no flight that day. Used to seed the DB and resolve flights.
 */

export const SOURCE_WEEK = "2026-06-22";
export const SOURCE_NAME = "RTD static schedule (2026-06-22 – 2026-06-28)";

/** Airport metadata (country, IANA tz, UTC offset for the schedule window). */
export const AIRPORT_META: Record<string, { country: string; timezone: string; offsetMin: number }> = {
  RUH: { country: "SA", timezone: "Asia/Riyadh", offsetMin: 180 },
  LHR: { country: "GB", timezone: "Europe/London", offsetMin: 60 },
  LGW: { country: "GB", timezone: "Europe/London", offsetMin: 60 },
  CDG: { country: "FR", timezone: "Europe/Paris", offsetMin: 120 },
  ORY: { country: "FR", timezone: "Europe/Paris", offsetMin: 120 },
  DXB: { country: "AE", timezone: "Asia/Dubai", offsetMin: 240 },
  CAI: { country: "EG", timezone: "Africa/Cairo", offsetMin: 180 },
};

/** Approximate flight duration (minutes) per directed route. */
export const ROUTE_DURATIONS: Record<string, number> = {
  "RUH-LHR": 420, "LHR-RUH": 400,
  "RUH-CDG": 405, "CDG-RUH": 385,
  "RUH-DXB": 110, "DXB-RUH": 115,
  "RUH-CAI": 185, "CAI-RUH": 180,
};

export function routeDuration(origin: string, destination: string): number {
  return ROUTE_DURATIONS[`${origin}-${destination}`] ?? 180;
}

export const FLIGHT_SCHEDULE_CSV = `origin,destination,airline,flight_code,mon,tue,wed,thu,fri,sat,sun
RUH,LHR,Saudia,SV111,02:30,----,02:30,02:30,02:30,02:35,02:30
RUH,LHR,Saudia,SV121,----,09:15,----,----,09:15,09:15,09:15
RUH,LHR,Saudia,SV105,----,----,09:50,----,----,----,----
RUH,LHR,Saudia,SV109,----,----,----,----,----,----,10:35
LHR,RUH,Saudia,SV110,10:00,----,10:00,10:00,10:00,10:00,10:00
LHR,RUH,Saudia,SV122,----,16:15,----,----,16:15,16:15,16:15
LHR,RUH,Saudia,SV108,----,----,----,----,----,----,17:30
LHR,RUH,Saudia,SV106,----,----,17:50,----,----,----,----
RUH,CDG,Saudia,SV143,02:00,02:00,02:00,02:00,02:00,02:00,02:00
CDG,RUH,Saudia,SV144,11:30,11:30,11:30,11:30,11:30,11:30,11:30
CDG,RUH,Air France,AF684,13:10,----,13:10,----,----,13:10,----
RUH,DXB,Emirates,EK816,03:50,03:50,03:50,03:50,03:50,03:50,03:50
RUH,DXB,Emirates,EK820,09:40,09:40,09:40,09:40,09:40,09:40,09:40
RUH,DXB,Emirates,EK818,20:25,20:25,20:25,20:25,20:25,20:25,20:25
RUH,DXB,flydubai,FZ848,09:50,09:50,09:50,09:50,09:50,09:50,09:50
RUH,DXB,flydubai,FZ842,13:15,13:15,13:15,13:15,13:15,13:15,13:15
RUH,DXB,flydubai,FZ856,21:15,21:15,21:15,21:15,21:15,21:15,21:15
RUH,DXB,Saudia,SV596,09:00,09:00,09:00,09:00,09:00,09:00,09:00
RUH,DXB,Saudia,SV554,13:45,13:45,13:45,13:45,13:45,----,13:45
RUH,DXB,Flynas,XY215,02:45,----,----,----,----,----,02:45
RUH,DXB,Flynas,XY201,07:40,07:40,----,07:40,----,----,07:40
RUH,DXB,Flynas,XY205,12:20,12:20,12:20,12:20,12:20,12:20,12:20
RUH,DXB,Flynas,XY207,15:50,15:50,15:50,15:50,15:50,15:50,15:50
RUH,DXB,Flyadeal,F3505,08:50,----,08:50,08:50,08:50,08:50,08:50
RUH,DXB,Flyadeal,F3511,----,----,----,----,17:30,17:30,17:30
RUH,DXB,Flyadeal,F3513,----,----,----,----,18:50,18:50,18:50
RUH,DXB,Flyadeal,F3519,----,----,----,----,23:25,23:25,23:25
DXB,RUH,Emirates,EK815,00:55,00:55,00:55,00:55,00:55,00:55,00:55
DXB,RUH,Emirates,EK819,06:45,06:45,06:45,06:45,06:45,06:45,06:45
DXB,RUH,Emirates,EK817,16:45,16:45,16:45,16:45,16:45,16:45,16:45
DXB,RUH,flydubai,FZ847,07:30,07:30,07:30,07:30,07:30,07:30,07:30
DXB,RUH,flydubai,FZ841,10:55,10:55,10:55,10:55,10:55,10:55,10:55
DXB,RUH,flydubai,FZ855,18:55,18:55,18:55,18:55,18:55,18:55,18:55
DXB,RUH,Saudia,SV597,13:20,13:20,13:20,13:20,13:20,13:20,13:20
DXB,RUH,Saudia,SV555,18:15,18:15,18:15,18:15,18:15,----,18:15
DXB,RUH,Flynas,XY216,06:40,----,----,----,----,----,06:40
DXB,RUH,Flynas,XY202,11:25,11:25,----,11:25,----,----,11:25
DXB,RUH,Flynas,XY206,16:15,16:15,16:15,16:15,16:15,16:15,16:15
DXB,RUH,Flynas,XY208,19:45,19:45,19:45,19:45,19:45,19:45,19:45
DXB,RUH,Flyadeal,F3520,----,----,----,----,----,05:20,05:20
DXB,RUH,Flyadeal,F3506,12:50,----,12:50,12:50,12:50,12:50,12:50
DXB,RUH,Flyadeal,F3512,----,----,----,----,21:35,21:35,21:35
DXB,RUH,Flyadeal,F3514,----,----,----,----,22:45,22:45,22:45
RUH,CAI,EgyptAir,MS650,04:05,04:05,04:05,04:05,04:05,04:05,04:05
RUH,CAI,EgyptAir,MS652,13:00,13:00,13:00,13:00,13:00,13:00,13:00
RUH,CAI,EgyptAir,MS690,16:00,16:00,16:00,16:00,16:00,16:00,16:00
RUH,CAI,EgyptAir,MS648,22:15,22:15,22:15,22:15,22:15,22:15,22:15
RUH,CAI,Saudia,SV323,00:40,00:40,00:40,00:40,00:40,00:40,00:40
RUH,CAI,Saudia,SV3253,----,----,----,----,04:55,----,----
RUH,CAI,Saudia,SV3251,----,----,----,05:05,----,----,----
RUH,CAI,Saudia,SV311,07:25,07:25,07:25,07:25,07:25,07:25,07:25
RUH,CAI,Saudia,SV417,12:00,11:50,11:50,11:50,11:50,12:00,11:50
RUH,CAI,Saudia,SV313,16:50,16:50,16:50,16:50,16:50,16:50,16:50
RUH,CAI,Saudia,SV321,20:30,20:30,20:30,20:30,20:30,20:30,20:30
RUH,CAI,Flynas,XY263,07:05,07:05,07:05,07:05,07:05,07:05,07:05
RUH,CAI,Flynas,XY273,09:10,09:10,09:10,09:10,09:10,09:10,09:10
RUH,CAI,Flynas,XY267,12:00,12:00,12:00,12:00,12:00,12:00,12:00
RUH,CAI,Flynas,XY271,16:25,16:25,16:25,16:25,16:25,16:25,16:25
RUH,CAI,Flynas,XY265,19:40,19:40,19:40,19:40,19:40,19:40,19:40
RUH,CAI,Flynas,XY287,----,----,21:40,21:40,21:40,21:40,21:40
RUH,CAI,Nile Air,NP254,----,----,----,----,----,02:20,03:30
RUH,CAI,Nile Air,NP152,08:45,08:50,08:50,08:00,09:00,08:50,----
RUH,CAI,Nile Air,NP452,----,----,----,----,09:45,----,----
RUH,CAI,Nile Air,NP252,15:05,12:55,13:35,15:30,----,12:05,14:30
RUH,CAI,Nile Air,NP354,----,----,----,----,17:35,----,----
RUH,CAI,Nile Air,NP154,----,----,----,----,----,----,20:05
RUH,CAI,Nile Air,NP352,----,----,----,23:10,----,----,----
RUH,CAI,Air Cairo,SM470,17:45,17:45,18:15,18:40,16:35,08:20,14:05
RUH,CAI,Air Cairo,SM468,----,----,----,14:05,----,17:10,----
RUH,CAI,Air Cairo,SM462,----,----,----,----,----,14:45,----
RUH,CAI,Flyadeal,F3613,----,----,----,----,08:30,08:30,08:30
RUH,CAI,Flyadeal,F3605,----,----,----,----,10:15,10:15,10:15
RUH,CAI,Flyadeal,F3607,12:00,12:00,12:00,12:00,12:00,12:00,12:00
RUH,CAI,Flyadeal,F3615,22:55,22:55,22:55,22:55,22:55,22:55,22:55
RUH,CAI,Air Arabia Egypt,E5411,----,15:10,----,15:10,15:50,15:10,15:10
RUH,CAI,Nesma Airlines,NE163,----,03:05,----,----,14:05,----,14:15
RUH,CAI,Nesma Airlines,NE167,----,----,----,----,----,----,05:40
RUH,CAI,Nesma Airlines,NE161,07:30,07:35,06:45,06:45,06:45,07:35,----
RUH,CAI,Nesma Airlines,NE165,----,----,23:15,----,----,20:00,----
RUH,CAI,Air France,AF685,22:35,----,22:35,----,----,22:35,----
CAI,RUH,EgyptAir,MS649,00:25,00:25,00:25,00:25,00:25,00:25,00:25
CAI,RUH,EgyptAir,MS651,09:20,09:20,09:20,09:20,09:20,09:20,09:20
CAI,RUH,EgyptAir,MS689,12:20,12:20,12:20,12:20,12:20,12:30,12:30
CAI,RUH,EgyptAir,MS647,18:40,18:40,18:40,18:40,18:40,18:40,18:40
CAI,RUH,Saudia,SV320,00:35,00:35,00:35,00:35,00:35,00:35,00:35
CAI,RUH,Saudia,SV3262,----,----,----,----,00:50,----,----
CAI,RUH,Saudia,SV322,04:45,04:45,04:45,04:45,04:45,04:45,04:45
CAI,RUH,Saudia,SV3260,----,----,----,09:20,----,----,----
CAI,RUH,Saudia,SV3264,----,----,----,----,09:20,----,----
CAI,RUH,Saudia,SV310,11:40,11:40,11:40,11:40,11:40,11:40,11:40
CAI,RUH,Saudia,SV418,16:05,16:05,16:05,16:05,16:05,16:05,16:05
CAI,RUH,Flynas,XY288,01:30,01:30,----,01:30,01:30,01:30,01:30
CAI,RUH,Flynas,XY264,10:50,10:50,10:50,10:50,10:50,10:50,10:50
CAI,RUH,Flynas,XY274,12:55,12:55,12:55,12:55,12:55,12:55,12:55
CAI,RUH,Flynas,XY268,15:45,15:45,15:45,15:45,15:45,15:45,15:45
CAI,RUH,Flynas,XY272,20:10,20:10,20:10,20:10,20:10,20:10,20:10
CAI,RUH,Flynas,XY266,23:25,23:25,23:25,23:25,23:25,23:25,23:25
CAI,RUH,Nile Air,NP151,05:00,05:05,05:05,04:15,05:15,05:05,----
CAI,RUH,Nile Air,NP451,----,----,----,----,06:00,----,----
CAI,RUH,Nile Air,NP251,11:20,09:10,09:50,11:45,----,08:20,10:45
CAI,RUH,Nile Air,NP353,----,----,----,----,13:50,----,----
CAI,RUH,Nile Air,NP153,----,----,----,----,----,----,16:20
CAI,RUH,Nile Air,NP351,----,----,----,19:25,----,----,----
CAI,RUH,Nile Air,NP253,----,----,----,----,22:35,23:45,----
CAI,RUH,Air Cairo,SM469,14:10,14:10,14:40,15:05,13:00,04:45,10:30
CAI,RUH,Air Cairo,SM467,----,----,----,10:30,----,13:35,----
CAI,RUH,Air Cairo,SM461,----,----,----,----,----,11:10,----
CAI,RUH,Flyadeal,F3616,02:35,02:35,02:35,02:35,02:35,02:35,02:35
CAI,RUH,Flyadeal,F3614,----,----,----,----,12:10,12:10,12:10
CAI,RUH,Flyadeal,F3606,----,----,----,----,13:55,13:55,13:55
CAI,RUH,Flyadeal,F3608,15:40,15:40,15:40,15:40,15:40,15:40,15:40
CAI,RUH,Air Arabia Egypt,E5410,----,11:40,----,11:40,12:20,11:40,11:40
CAI,RUH,Nesma Airlines,NE166,----,----,----,----,----,----,02:00
CAI,RUH,Nesma Airlines,NE160,03:50,03:55,03:05,03:05,03:05,04:05,----
CAI,RUH,Nesma Airlines,NE162,23:25,----,----,----,10:25,----,10:35
CAI,RUH,Nesma Airlines,NE164,----,----,19:35,----,----,16:20,----`;

export interface ParsedScheduleRow {
  origin: string;
  destination: string;
  airlineName: string;
  airlineCode: string;
  flightCode: string;
  dayOfWeek: number; // 1=Mon … 7=Sun
  departureTimeLocal: string; // HH:MM
}

/** Parse the CSV into one row per active weekday (skips "----"). */
export function parseFlightSchedule(csv: string = FLIGHT_SCHEDULE_CSV): ParsedScheduleRow[] {
  const rows: ParsedScheduleRow[] = [];
  const lines = csv.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("origin,"));
  for (const line of lines) {
    const [origin, destination, airlineName, flightCode, ...days] = line.split(",");
    if (!flightCode || days.length < 7) continue;
    const airlineCode = flightCode.replace(/[^A-Z0-9]/g, "").slice(0, 2);
    days.slice(0, 7).forEach((cell, i) => {
      const time = cell.trim();
      if (!time || time === "----") return; // skip no-flight days
      rows.push({
        origin,
        destination,
        airlineName,
        airlineCode,
        flightCode,
        dayOfWeek: i + 1,
        departureTimeLocal: time,
      });
    });
  }
  return rows;
}
