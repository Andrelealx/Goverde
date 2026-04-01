import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Search, Leaf, MapPin,
  TreePine, Flame, Trash2, Droplets, Volume2, Bird, ArrowRight,
  ShieldCheck, Clock,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const categorias = [
  { icon: TreePine, label: 'Desmatamento', cor: 'text-green-600 bg-green-50 border-green-100', valor: 'DESMATAMENTO' },
  { icon: Flame, label: 'Queimada', cor: 'text-orange-500 bg-orange-50 border-orange-100', valor: 'QUEIMADA' },
  { icon: Trash2, label: 'Resíduos Ilegais', cor: 'text-yellow-600 bg-yellow-50 border-yellow-100', valor: 'RESIDUOS_ILEGAIS' },
  { icon: Droplets, label: 'Poluição Hídrica', cor: 'text-blue-500 bg-blue-50 border-blue-100', valor: 'POLUICAO_HIDRICA' },
  { icon: Volume2, label: 'Poluição Sonora', cor: 'text-purple-500 bg-purple-50 border-purple-100', valor: 'POLUICAO_SONORA' },
  { icon: Bird, label: 'Fauna', cor: 'text-teal-500 bg-teal-50 border-teal-100', valor: 'FAUNA' },
];

const etapas = [
  { icon: AlertTriangle, num: '1', label: 'Registre', desc: 'Informe o tipo de problema, localização e adicione fotos.' },
  { icon: Clock, num: '2', label: 'Acompanhe', desc: 'Use o protocolo gerado para consultar o andamento a qualquer hora.' },
  { icon: ShieldCheck, num: '3', label: 'Resolvido', desc: 'Nossa equipe age em campo e atualiza o status em tempo real.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-500 to-primary-400 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-10 right-0 w-72 h-72 bg-white/5 rounded-full" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex-1 text-center md:text-left"
          >
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full mb-5 border border-white/20">
              🌿 Portal Ambiental Municipal
            </span>
            <h1 className="font-sora font-bold text-4xl sm:text-5xl leading-tight mb-4">
              Proteja o meio<br />ambiente da sua cidade
            </h1>
            <p className="text-primary-100 text-base md:text-lg mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
              Registre denúncias, acompanhe o status em tempo real e ajude a preservar a natureza do seu município.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/denuncia" className="flex items-center justify-center gap-2 bg-white text-primary-600 font-semibold px-6 py-3.5 rounded-2xl hover:bg-primary-50 transition-colors shadow-lg text-sm">
                <AlertTriangle size={17} /> Registrar Denúncia
              </Link>
              <Link to="/protocolo" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-2xl transition-colors border border-white/20 text-sm">
                <Search size={17} /> Consultar Protocolo
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="shrink-0 hidden md:block"
          >
            <div className="w-52 h-52 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl">
              <Leaf size={88} className="text-white/70" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-primary-700">
        <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-3 gap-4 text-center text-white">
          {[
            { valor: '1.200+', label: 'Denúncias registradas' },
            { valor: '87%', label: 'Taxa de resolução' },
            { valor: '48h', label: 'Tempo médio de resposta' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-sora font-bold text-xl md:text-2xl">{s.valor}</p>
              <p className="text-primary-200 text-[11px] md:text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="font-sora font-bold text-2xl text-gray-800">O que você quer denunciar?</h2>
          <p className="text-gray-400 mt-2 text-sm">Selecione a categoria para iniciar o registro</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {categorias.map(({ icon: Icon, label, cor, valor }) => (
            <Link
              key={valor}
              to={`/denuncia?categoria=${valor}`}
              className="group flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${cor} group-hover:scale-110 transition-transform`}>
                <Icon size={26} />
              </div>
              <p className="font-medium text-sm text-gray-700 text-center">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-sora font-bold text-2xl text-gray-800">Como funciona</h2>
            <p className="text-gray-400 mt-2 text-sm">Simples, rápido e transparente</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {etapas.map(({ icon: Icon, num, label, desc }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative"
              >
                <div className="absolute top-4 right-4 w-7 h-7 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {num}
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-primary-500" />
                </div>
                <h3 className="font-sora font-semibold text-gray-800 mb-2">{label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary-600 to-primary-500 rounded-3xl p-8 text-white flex flex-col justify-between min-h-[200px]"
        >
          <div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-sora font-bold text-xl mb-2">Viu algo suspeito?</h3>
            <p className="text-primary-100 text-sm leading-relaxed">Registre agora. Sua denúncia pode salvar uma área verde e proteger rios e animais.</p>
          </div>
          <Link to="/denuncia" className="mt-6 inline-flex items-center gap-2 bg-white text-primary-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors w-fit">
            Registrar <ArrowRight size={15} />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white border-2 border-gray-100 rounded-3xl p-8 flex flex-col justify-between min-h-[200px] shadow-sm"
        >
          <div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Search size={20} className="text-blue-500" />
            </div>
            <h3 className="font-sora font-bold text-xl mb-2 text-gray-800">Já fez uma denúncia?</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Use o número de protocolo para acompanhar o andamento e ver o histórico de ações.</p>
          </div>
          <Link to="/protocolo" className="mt-6 inline-flex items-center gap-2 bg-gray-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors w-fit">
            Consultar <ArrowRight size={15} />
          </Link>
        </motion.div>
      </section>

      {/* Mapa CTA */}
      <section className="bg-primary-50 py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin size={22} className="text-primary-500" />
          </div>
          <h2 className="font-sora font-bold text-2xl text-gray-800 mb-2">Mapa de ocorrências</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">Visualize as denúncias registradas em um mapa interativo e em tempo real.</p>
          <Link to="/mapa" className="inline-flex items-center gap-2 bg-primary-500 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-primary-600 transition-colors shadow-md">
            <MapPin size={17} /> Ver mapa completo
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="font-sora font-bold text-2xl text-gray-800 mb-8 text-center">Dúvidas frequentes</h2>
        <div className="space-y-3 max-w-2xl mx-auto">
          {[
            { p: 'Preciso me identificar para fazer uma denúncia?', r: 'Não. A identificação é opcional. Você pode fazer uma denúncia anônima informando apenas o problema e a localização.' },
            { p: 'Quanto tempo leva para minha denúncia ser atendida?', r: 'Nossa equipe analisa todas as denúncias e prioriza por urgência. O tempo médio de resposta inicial é de 48 horas.' },
            { p: 'Como acompanho minha denúncia?', r: 'Ao registrar, você recebe um número de protocolo único. Use-o na página "Consultar Protocolo" para ver o status em tempo real.' },
            { p: 'Posso adicionar fotos?', r: 'Sim! Você pode adicionar até 5 fotos. As imagens ajudam nossa equipe a avaliar a situação com muito mais precisão.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-white border border-gray-100 rounded-2xl shadow-sm">
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-medium text-sm text-gray-700 list-none">
                {faq.p}
                <span className="text-gray-400 group-open:rotate-45 transition-transform duration-200 text-xl leading-none shrink-0 ml-3">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">{faq.r}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
