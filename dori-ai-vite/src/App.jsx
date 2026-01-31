import AnimalCard from './components/AnimalCard.jsx';
import animals from './data/animals.json';

const App = () => {
  return (
    <Layout>
      <section
        id="home"
        className="relative flex items-center justify-center min-h-screen text-center overflow-hidden"
      >
        <div
          className="absolute inset-0 z-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(120, 113, 222, 0.4) 0%, rgba(120, 113, 222, 0) 50%)',
          }}
        />
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black text-gray-800 dark:text-white mb-4"
          >
            Creative Studio
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="my-8"
          >
            <div className="w-full max-w-2xl mx-auto h-1 md:h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'gradientFlow 4s linear infinite',
                }}
              />
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-5xl md:text-7xl font-bold text-gray-700 dark:text-gray-300"
          >
            DORI-AI
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-lg text-gray-600 dark:text-gray-400 mt-8"
          >
            작은 시작을 함께 만들어갑니다. AI가 처음이어도, 누구나 배우고 성장할
            수 있는 공간입니다.
          </motion.p>
        </div>
      </section>

      <section id="features" className="py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
        >
          {animals.map((animal) => (
            <motion.div
              key={animal.name}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <AnimalCard {...animal} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="insight" className="py-20 min-h-[50vh] bg-gray-100 dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">인사이트 섹션</h2>
      </section>

      <section id="community" className="py-20 min-h-[50vh]">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">커뮤니티 섹션</h2>
      </section>

      <section id="faq" className="py-20 min-h-[50vh] bg-gray-100 dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">FAQ 섹션</h2>
      </section>
    </Layout>
  );
};

export default App;
