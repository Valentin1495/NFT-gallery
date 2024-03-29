package com.nfteam.server.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.nfteam.server.auth.utils.JwtTokenizer;
import com.nfteam.server.domain.member.entity.Member;
import com.nfteam.server.domain.member.entity.MemberPlatform;
import com.nfteam.server.domain.member.entity.MemberStatus;
import com.nfteam.server.domain.member.repository.MemberRepository;
import com.nfteam.server.dto.response.auth.GoogleUser;
import com.nfteam.server.dto.response.auth.SocialLoginResponse;
import com.nfteam.server.exception.member.MemberNotFoundException;
import com.nfteam.server.security.userdetails.MemberDetails;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Component
@Transactional(readOnly = true)
public class GoogleOAuth2 implements OAuth2 {

    private static final String USER_INFO_REQUEST_URL = "https://www.googleapis.com/oauth2/v1/userinfo";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final MemberRepository memberRepository;
    private final JwtTokenizer jwtTokenizer;

    public GoogleOAuth2(MemberRepository memberRepository, JwtTokenizer jwtTokenizer) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper().setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE);
        this.memberRepository = memberRepository;
        this.jwtTokenizer = jwtTokenizer;
    }

    @Override
    @Transactional
    public SocialLoginResponse proceedLogin(String token) {
        ResponseEntity<String> userInfoResponse = createGetInfoRequest(token);
        GoogleUser googleUser = getUserInfo(userInfoResponse);
        Boolean isAlreadySignUp = true;

        if (isFistLogin(googleUser)) {
            signUp(googleUser);
            isAlreadySignUp = false;
        }

        return makeSocialResponse(googleUser, isAlreadySignUp);
    }

    private ResponseEntity<String> createGetInfoRequest(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        HttpEntity<MultiValueMap<String, String>> httpEntity = new HttpEntity<>(headers);

        return restTemplate.exchange(USER_INFO_REQUEST_URL, HttpMethod.GET, httpEntity, String.class);
    }

    private GoogleUser getUserInfo(ResponseEntity<String> userInfoResponse) {
        GoogleUser googleUser;

        try {
            googleUser = objectMapper.readValue(userInfoResponse.getBody(), GoogleUser.class);
        } catch (JsonProcessingException exception) {
            throw new RuntimeException("구글 사용자 정보 json 변환에 실패하였습니다.");
        }

        return googleUser;
    }

    private boolean isFistLogin(GoogleUser googleUser) {
        return !memberRepository.existsByEmail(googleUser.getEmail());
    }

    public void signUp(GoogleUser googleUser) {
        Member member = new Member(googleUser.getEmail(), googleUser.getName(), MemberPlatform.GOOGLE);
        memberRepository.save(member);
    }

    public SocialLoginResponse makeSocialResponse(GoogleUser googleUser, Boolean isAlreadySignUp) {
        Member member = memberRepository.findByEmail(googleUser.getEmail())
                .filter(m -> !m.getMemberStatus().equals(MemberStatus.MEMBER_QUIT))
                .orElseThrow(() -> new MemberNotFoundException(googleUser.getEmail()));

        if (!isAlreadySignUp) {
            member.updateNickname(googleUser.getName());
            member.updateProfileImg(googleUser.getPicture());
        }
        member.updateLastLoginTime();

        MemberDetails memberDetails = new MemberDetails(member);
        String accessToken = "Bearer " + jwtTokenizer.generateAccessToken(memberDetails);
        String refreshToken = jwtTokenizer.generateRefreshToken();

        return new SocialLoginResponse(accessToken, refreshToken, member);
    }

}