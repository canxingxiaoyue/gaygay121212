export type Chapter = {
  number: number
  title: string
  content: string[]
}

export type Story = {
  slug: string
  title: string
  author: string
  cover: string
  genres: string[]
  status: 'Đang ra' | 'Hoàn thành'
  rating: number
  views: number
  description: string
  tags: string[]
  chapters: Chapter[]
}

export const GENRES = [
  'Ngôn tình',
  'Kiếm hiệp',
  'Huyền huyễn',
  'Trinh thám',
  'Đô thị',
  'Cổ đại',
  'Khoa học viễn tưởng',
] as const

function makeChapters(count: number, seedTitles: string[]): Chapter[] {
  return Array.from({ length: count }, (_, i) => {
    const number = i + 1
    const title = seedTitles[i % seedTitles.length]
    return {
      number,
      title: `Chương ${number}: ${title}`,
      content: [
        'Buổi sáng mùa thu, sương còn đọng trên những tán cây bên đường. Hương cà phê từ quán nhỏ đầu hẻm len lỏi qua khung cửa sổ, đánh thức cả con phố vẫn đang ngái ngủ.',
        'Nhân vật của chúng ta bước đi chậm rãi, lòng ngổn ngang trăm mối. Mỗi bước chân như chạm vào một ký ức cũ, vừa quen vừa lạ, vừa ấm áp lại vừa nhói đau.',
        'Có những điều người ta chỉ nhận ra khi đã đi qua. Như tách trà nguội dần trên bàn, như câu nói còn dang dở mãi chẳng kịp nói thành lời.',
        'Và rồi, ở khúc quanh định mệnh ấy, một quyết định được đưa ra. Không ai biết trước con đường phía sau sẽ dẫn về đâu, chỉ biết rằng quay đầu lại đã là không thể.',
        'Đêm xuống, ngọn đèn vàng hắt bóng lên bức tường loang lổ. Câu chuyện vẫn tiếp diễn, lặng lẽ như dòng sông cứ thế chảy về phía biển khơi xa thẳm.',
      ],
    }
  })
}

export const STORIES: Story[] = [
  {
    slug: 'huong-ca-phe-mua-cu',
    title: 'Hương Cà Phê Mùa Cũ',
    author: 'Lâm Vũ',
    cover: '/covers/huong-ca-phe.png',
    genres: ['Ngôn tình', 'Đô thị'],
    status: 'Đang ra',
    rating: 4.8,
    views: 128400,
    description:
      'Một quán cà phê nhỏ nơi góc phố cũ, nơi hai con người xa lạ tình cờ gặp lại nhau sau mười năm. Liệu hương vị xưa có đủ để hâm nóng một mối tình tưởng đã nguội lạnh?',
    tags: ['Ngọt ngào', 'Tái ngộ', 'Chữa lành'],
    chapters: makeChapters(24, [
      'Tách cà phê đầu tiên',
      'Người cũ trở về',
      'Mưa đầu mùa',
      'Lời chưa kịp nói',
      'Khúc quanh',
    ]),
  },
  {
    slug: 'thanh-kiem-vo-danh',
    title: 'Thanh Kiếm Vô Danh',
    author: 'Cố Thương',
    cover: '/covers/thanh-kiem.png',
    genres: ['Kiếm hiệp', 'Cổ đại'],
    status: 'Đang ra',
    rating: 4.6,
    views: 256300,
    description:
      'Giang hồ dậy sóng khi một thanh kiếm không tên xuất hiện. Người mang nó là kẻ vô danh, nhưng từng đường kiếm lại khiến cả võ lâm phải khiếp sợ và kính nể.',
    tags: ['Hành động', 'Giang hồ', 'Báo thù'],
    chapters: makeChapters(40, [
      'Kiếm xuất giang hồ',
      'Ân oán mười năm',
      'Đêm trăng huyết',
      'Trận chiến đỉnh núi',
      'Lời thề năm xưa',
    ]),
  },
  {
    slug: 'thanh-pho-khong-ngu',
    title: 'Thành Phố Không Ngủ',
    author: 'Diệp Minh',
    cover: '/covers/thanh-pho.png',
    genres: ['Trinh thám', 'Đô thị'],
    status: 'Hoàn thành',
    rating: 4.9,
    views: 412000,
    description:
      'Một loạt vụ án bí ẩn xảy ra giữa lòng thành phố. Nữ thám tử trẻ phải chạy đua với thời gian để lần theo dấu vết của kẻ sát nhân luôn đi trước cô một bước.',
    tags: ['Phá án', 'Hồi hộp', 'Plot twist'],
    chapters: makeChapters(36, [
      'Vụ án đầu tiên',
      'Manh mối trong bóng tối',
      'Kẻ giấu mặt',
      'Sự thật phơi bày',
      'Đêm cuối cùng',
    ]),
  },
  {
    slug: 'tien-lo-mang-mang',
    title: 'Tiên Lộ Mang Mang',
    author: 'Vô Phong',
    cover: '/covers/tien-lo.png',
    genres: ['Huyền huyễn', 'Cổ đại'],
    status: 'Đang ra',
    rating: 4.5,
    views: 198700,
    description:
      'Từ một thiếu niên phàm trần, hắn bước lên con đường tu tiên đầy gian khó. Vượt thiên kiếp, đoạt cơ duyên, chỉ để tìm câu trả lời cho một câu hỏi tưởng chừng đơn giản.',
    tags: ['Tu tiên', 'Thăng cấp', 'Phiêu lưu'],
    chapters: makeChapters(50, [
      'Phàm trần khởi bộ',
      'Linh căn giác tỉnh',
      'Tông môn thử thách',
      'Thiên kiếp giáng lâm',
      'Cảnh giới mới',
    ]),
  },
  {
    slug: 'nam-cuoi-cung-cua-trai-dat',
    title: 'Năm Cuối Cùng Của Trái Đất',
    author: 'Hà Thanh',
    cover: '/covers/trai-dat.png',
    genres: ['Khoa học viễn tưởng'],
    status: 'Hoàn thành',
    rating: 4.7,
    views: 167900,
    description:
      'Khi nhân loại chỉ còn ba trăm sáu mươi lăm ngày trước thảm họa, một nhóm nhà khoa học quyết định làm điều không tưởng để cứu lấy nền văn minh cuối cùng.',
    tags: ['Tận thế', 'Khoa học', 'Hy vọng'],
    chapters: makeChapters(28, [
      'Đếm ngược bắt đầu',
      'Kế hoạch tuyệt vọng',
      'Con tàu cuối cùng',
      'Lựa chọn của nhân loại',
      'Bình minh mới',
    ]),
  },
  {
    slug: 'gio-qua-tham-lung',
    title: 'Gió Qua Thềm Lụng',
    author: 'Tịnh Y',
    cover: '/covers/gio-qua.png',
    genres: ['Ngôn tình', 'Cổ đại'],
    status: 'Đang ra',
    rating: 4.4,
    views: 89300,
    description:
      'Chốn thâm cung đầy toan tính, một nàng cung nữ thông minh từng bước vươn lên giữa muôn vàn hiểm nguy, mang theo một bí mật có thể thay đổi cả triều đại.',
    tags: ['Cung đấu', 'Trí tuệ', 'Lãng mạn'],
    chapters: makeChapters(32, [
      'Nhập cung',
      'Sóng ngầm hậu cung',
      'Ván cờ quyền lực',
      'Trái tim lạc lối',
      'Định mệnh xoay vần',
    ]),
  },
  {
    slug: 'ke-san-bong-dem',
    title: 'Kẻ Săn Bóng Đêm',
    author: 'Lý Hàn',
    cover: '/covers/san-bong-dem.png',
    genres: ['Huyền huyễn', 'Đô thị'],
    status: 'Hoàn thành',
    rating: 4.6,
    views: 145600,
    description:
      'Giữa thành phố hiện đại, những sinh vật bóng đêm vẫn lẩn khuất. Một thợ săn cô độc gánh trên vai sứ mệnh bảo vệ ranh giới giữa hai thế giới.',
    tags: ['Siêu nhiên', 'Hành động', 'Bí ẩn'],
    chapters: makeChapters(30, [
      'Đêm đầu tiên',
      'Hợp đồng máu',
      'Kẻ phản bội',
      'Ranh giới mong manh',
      'Ánh sáng cuối đường',
    ]),
  },
  {
    slug: 'lat-cat-thoi-gian',
    title: 'Lát Cắt Thời Gian',
    author: 'Mộc Vân',
    cover: '/covers/lat-cat.png',
    genres: ['Khoa học viễn tưởng', 'Trinh thám'],
    status: 'Đang ra',
    rating: 4.3,
    views: 76200,
    description:
      'Một cỗ máy cho phép nhìn lại quá khứ trong vài giây. Nhưng khi sử dụng nó để phá án, ranh giới giữa sự thật và ảo ảnh dần trở nên mờ nhạt một cách đáng sợ.',
    tags: ['Du hành thời gian', 'Trí não', 'Căng thẳng'],
    chapters: makeChapters(20, [
      'Phát minh nguy hiểm',
      'Ba giây quá khứ',
      'Sai lệch đầu tiên',
      'Vòng lặp',
      'Điểm gãy',
    ]),
  },
]

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  date: string
  category: string
  content: string[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'cach-chon-truyen-de-doc',
    title: 'Cách chọn một cuốn truyện hợp gu để đọc',
    excerpt:
      'Giữa hàng ngàn đầu truyện, làm sao để tìm được cuốn khiến bạn thức trắng đêm? Vài mẹo nhỏ từ quán.',
    date: '12 Tháng 5, 2026',
    category: 'Mẹo đọc',
    content: [
      'Đọc truyện cũng giống như chọn một loại cà phê. Có người thích vị đậm đắng của kiếm hiệp, có người mê chút ngọt ngào của ngôn tình.',
      'Lời khuyên đầu tiên: đừng vội đánh giá qua bìa. Hãy đọc thử ba chương đầu, nếu giọng văn cuốn bạn đi thì đó là dấu hiệu tốt.',
      'Thứ hai, hãy để ý đến nhịp truyện. Một câu chuyện hay không nhất thiết phải nhanh, nhưng phải khiến bạn muốn lật sang trang tiếp theo.',
    ],
  },
  {
    slug: 'vi-sao-toi-mo-quan-truyen',
    title: 'Vì sao tôi mở Quán Truyện',
    excerpt:
      'Một chút tâm sự của chủ quán về hành trình biến niềm đam mê đọc thành một góc nhỏ chia sẻ với mọi người.',
    date: '28 Tháng 4, 2026',
    category: 'Tâm sự',
    content: [
      'Tôi vẫn nhớ những buổi chiều mưa, cuộn mình trong chăn với một cuốn tiểu thuyết và tách cà phê nóng. Đó là khoảnh khắc bình yên nhất.',
      'Quán Truyện ra đời từ mong muốn chia sẻ cảm giác ấy. Một nơi không xô bồ, chỉ có chữ nghĩa và những câu chuyện được kể bằng cả tấm lòng.',
      'Cảm ơn bạn đã ghé quán. Hãy cứ thong thả, gọi một tách cà phê tưởng tượng và bắt đầu trang đầu tiên nhé.',
    ],
  },
  {
    slug: 'top-the-loai-duoc-yeu-thich',
    title: 'Top thể loại được độc giả yêu thích nhất',
    excerpt:
      'Thống kê vui từ quán về những thể loại đang khiến độc giả mê mẩn trong thời gian gần đây.',
    date: '15 Tháng 4, 2026',
    category: 'Bảng xếp hạng',
    content: [
      'Dẫn đầu bảng vẫn là ngôn tình đô thị, với những câu chuyện gần gũi và dễ đồng cảm.',
      'Theo sát phía sau là huyền huyễn tu tiên, thể loại luôn có lượng độc giả trung thành đông đảo.',
      'Bất ngờ của mùa này là sự trỗi dậy của trinh thám, khi độc giả ngày càng yêu thích những câu chuyện đòi hỏi tư duy.',
    ],
  },
]

export const OWNER_NOTES = [
  {
    title: 'Lịch cập nhật truyện',
    body: 'Quán cập nhật chương mới vào tối Thứ Ba, Thứ Năm và Chủ Nhật hàng tuần. Mong các bạn thông cảm nếu thỉnh thoảng có chậm trễ nhé.',
  },
  {
    title: 'Về bản quyền',
    body: 'Tất cả truyện trên Quán Truyện đều là nội dung mẫu để minh họa giao diện. Vui lòng không sao chép khi sử dụng cho mục đích thương mại.',
  },
  {
    title: 'Góp ý và yêu cầu',
    body: 'Nếu bạn muốn quán đăng thêm thể loại nào, cứ để lại bình luận ở cuối mỗi truyện. Chủ quán đọc hết và rất trân trọng mọi góp ý.',
  },
  {
    title: 'Lời cảm ơn',
    body: 'Cảm ơn bạn đã đồng hành cùng quán. Mỗi lượt đọc, mỗi bình luận đều là động lực để quán tiếp tục kể những câu chuyện hay.',
  },
]

export function getStory(slug: string) {
  return STORIES.find((s) => s.slug === slug)
}

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function formatViews(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}
