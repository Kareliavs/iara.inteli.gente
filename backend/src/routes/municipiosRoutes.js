const express = require("express");
const {
  getMunicipios,
  buscarMunicipios,
  getMunicipioPorSlug,
  getIndicadoresMunicipio,
  getResumoPontuacaoDimensao,
  getResumoPopulacao,
  getResumoMunicipios,
  getSerieVariavelMunicipio,
  getComparativoMunicipiosSemelhantes,
} = require("../controllers/municipiosController");

const router = express.Router();

router.get("/municipios", getMunicipios);
router.get("/municipios/resumo", getResumoMunicipios);
router.get("/municipios/resumo-populacao", getResumoPopulacao);
router.get("/municipios/busca", buscarMunicipios);
router.get("/municipios/slug/:cityFriendlyName", getMunicipioPorSlug);
router.get("/municipios/:municipioCodIbge/variaveis/:variavelSigla/serie", getSerieVariavelMunicipio);
router.get("/municipios/:municipioCodIbge/comparativo-semelhantes", getComparativoMunicipiosSemelhantes);
router.get("/municipios/:municipioCodIbge/dimensao/resumo-pontuacao", getResumoPontuacaoDimensao);
router.get("/municipios/:municipioCodIbge/indicadores", getIndicadoresMunicipio);

module.exports = router;
