/**
 * Rotas de Compartilhamento de Veículos
 * Permite compartilhar veículos via link público seguro
 */

import express from 'express';
import { query, queryOne, queryAll } from '../database/db-adapter.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * GET /compartilhamento/:token
 * Retorna dados públicos do veículo compartilhado (SEM autenticação)
 */
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.trim() === '') {
      return res.status(400).json({ error: 'Token inválido' });
    }

    // Buscar compartilhamento pelo token
    const compartilhamento = await queryOne(
      `SELECT * FROM veiculo_compartilhamentos 
       WHERE token = ? AND tipo = 'visualizacao'`,
      [token]
    );

    if (!compartilhamento) {
      return res.status(404).json({ error: 'Link de compartilhamento não encontrado ou inválido' });
    }

    // Verificar se expirou
    if (compartilhamento.expira_em) {
      const dataExpiracao = new Date(compartilhamento.expira_em);
      const agora = new Date();
      if (dataExpiracao < agora) {
        return res.status(410).json({ error: 'Link de compartilhamento expirado' });
      }
    }

    const veiculoId = compartilhamento.veiculo_id;

    // Buscar dados do veículo
    const veiculo = await queryOne(
      'SELECT id, placa, renavam, marca, modelo, ano, tipo_veiculo, km_atual FROM veiculos WHERE id = ?',
      [veiculoId]
    );

    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Buscar histórico de manutenções (sem valores privados)
    const manutencoes = await queryAll(
      `SELECT 
        id,
        veiculo_id,
        data,
        km_antes,
        km_depois,
        tipo,
        tipo_manutencao,
        area_manutencao,
        descricao,
        imagem_url
      FROM manutencoes
      WHERE veiculo_id = ?
      ORDER BY data DESC, id DESC`,
      [veiculoId]
    );

    // Processar manutenções: remover valores privados
    const manutencoesPublicas = manutencoes.map(man => ({
      id: man.id,
      veiculo_id: man.veiculo_id,
      data: man.data,
      km_antes: man.km_antes,
      km_depois: man.km_depois,
      tipo: man.tipo,
      tipo_manutencao: man.tipo_manutencao,
      area_manutencao: man.area_manutencao,
      descricao: man.descricao,
      imagem_url: man.imagem_url,
      // NÃO incluir: valor, observacoes
    }));

    // Buscar histórico de KM (público)
    const kmHistorico = await queryAll(
      `SELECT 
        id,
        veiculo_id,
        km,
        origem,
        data_registro,
        criado_em
      FROM km_historico
      WHERE veiculo_id = ?
      ORDER BY data_registro DESC, criado_em DESC`,
      [veiculoId]
    );

    // Retornar dados públicos
    res.json({
      veiculo: {
        id: veiculo.id,
        placa: veiculo.placa,
        renavam: veiculo.renavam,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        tipo_veiculo: veiculo.tipo_veiculo,
        km_atual: veiculo.km_atual,
      },
      manutencoes: manutencoesPublicas,
      km_historico: kmHistorico,
      compartilhamento: {
        tipo: compartilhamento.tipo,
        criado_em: compartilhamento.criado_em,
        expira_em: compartilhamento.expira_em,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar veículo compartilhado:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do veículo compartilhado' });
  }
});

export default router;

