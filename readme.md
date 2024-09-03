# 개인 학습용 프로젝트
## AI11기 김재영
### express 브랜치
1. **프레임 워크 학습**: 
    
    화면이 꼭 필요한 기능 외에는 기본적으로 서버만 구현한다. 기본적인 블로그 crud를 기준으로 express 브랜치와 nest 브랜치를 만들어서 동일한 기능에서 프레임워크 별 코드 스타일을 파악한다. express에서도 nest와 가능한 비슷한 스타일로 깔끔하게 코드를 작성하는 것을 목표로 한다.
    
    시작 조건:
    
    - aws rdb를 사용하여 mysql에 접속하고 orm없이 sql을 사용하며 mvc계층구조를 구성한다.
    - 환경변수는 .env 하나를 이용한다.
    - cqrs 스타일은 적용하지 않는다.
    - 모든 조회는 db 직접 조회로 한다.
    - 페이지네이션은 offset 스타일로 구현한다.
    - dto는 class-validator와 class-transformer를 사용하여 구현한다.
    - typescript를 사용한다.