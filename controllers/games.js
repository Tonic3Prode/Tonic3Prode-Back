const { Games, Users } = require("../db_models");
const gamesData = require("../seed/games");

module.exports = {
  getAll: async (req, res) => {
    let games;
    try {
      games = await Games.find({}).populate("tournaments");
      res.send(games);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  getGamesByTournamentId: async (req, res) => {
    try {
      const games = await Games.find({ tournaments: req.params.id }).populate(
        "tournaments",
        "title"
      );
      res.send(games);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  adminCreateAGame: async (req, res) => {
    const { stage, status, details, result, tournaments } = req.body;
    const newGame = new Games({
      tournaments,
      stage,
      status,
      details,
      result,
    });
    await newGame.save();
    res.send(newGame);
  },

  // CREATE ALL GAMES OF ONE STAGE

  bulkCreateAGames: async (req, res, next) => {
    const tournamentId = req.params.id;
    const { stage, status, details, result, uid } = req.body; // AGREGAR gamesData que va a venir del front
    const user = await Users.findOne({ uid });
    if (!user) {
      return res.status(404).send("User not found");
    }
    if (user.rol !== "superAdmin" && user.rol !== "admin") {
      return res.status(403).send("You are not allowed to do this action");
    }
    try {
      if (!Array.isArray(gamesData) || gamesData.length === 0) {
        return res.status(400).send({ error: "Invalid or missing games data" });
      }

      const games = [];

      for (let i = 0; i < gamesData.length; i++) {
        const team1 = gamesData[i][0];
        const team2 = gamesData[i][1];
        const dayOfTheWeek = gamesData[i][2].dayOfTheWeek;
        const dayOfTheMonth = gamesData[i][2].dayOfTheMonth;
        const month = gamesData[i][2].month;
        const hour = gamesData[i][2].hour;
        const gameIndex = i;

        const newGame = new Games({
          tournaments: tournamentId,
          gameIndex: gameIndex,
          stage,
          status,
          details,
          teams: [team1, team2],
          dayOfTheWeek: dayOfTheWeek,
          dayOfTheMonth: dayOfTheMonth,
          month: month,
          hour: hour,
          result,
        });

        games.push(newGame);
        await newGame.save();
      }
      res.send("Los encuentros se han creado correctamente");
    } catch (err) {
      next(err);
    }
  },

  // GENERATE FUTURE GAMES ---- EN PROCESO

  generateFutureGames: async (req, res, next) => {
    // No encuentro los games de un torneo especifico
    const tournamentId = req.params.id;
    const games = await Games.find({
      tournaments: tournamentId,
      status: "pending",
    }); // devuelve array vacio
    // mapear juegos y buscar ganadores
    games.map((game) => {
      // pensar logica
    });
    res.send(games);
    //aguardar ganadores para crear llave siguiente

    // crear juegos de la siguiente llave

    // guardar juegos en la base de datos
  },

  //---- EN PROCESO

  // RUTA PARA AGREGAR LOS RESULTADOS DE UN PARTIDO

  addResult: async (req, res, next) => {
    const gameId = req.params.id;
    const { team1, team2, score1, score2, winner, uid } = req.body;
    const user = await Users.findOne({ uid });
    if (!user) {
      return res.status(404).send("User not found");
    }
    if (user.rol !== "superAdmin" && user.rol !== "admin") {
      return res.status(403).send("You are not allowed to do this action");
    }
    try {
      const result = {
        team1,
        team2,
        score1,
        score2,
        winner,
      };

      const game = await Games.findOne({ _id: gameId });
      // Validar que los equipos ingresados existan
      if (
        !game.teams[0].name.includes(team1) ||
        !game.teams[1].name.includes(team2)
      ) {
        return res.status(400).send({ error: "Invalid or missing teams" });
      }
      //varificar que los resultados sean correctos
      if (score1 < 0 || score2 < 0) {
        return res.status(400).send({ error: "Invalid or missing scores" });
      }
      if (winner !== team1 && winner !== team2) {
        return res.status(400).send({ error: "Invalid or missing winner" });
      }
      const updatedGame = await Games.findOneAndUpdate(
        { _id: gameId },
        { result: result },
        { new: true }
      );
      res.send(updatedGame);
    } catch (err) {
      next(err);
    }
  },

  adminEditAGame: async (req, res) => {
    let game;
    try {
      game = await Games.findOneAndUpdate({ _id: req.params.id }, req.body);
      res.send(game);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  //---- EN PROCESO

  adminDeleteAGame: async (req, res) => {
    let game;
    try {
      game = await Games.deleteOne({ _id: req.params.id });
      res.send(game);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  deleteGames: async (req, res, next) => {
    try {
      await Games.deleteMany();
      res.send("All games were deleted");
    } catch (err) {
      next(err);
    }
  },
};
